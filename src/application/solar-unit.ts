import { User as ClerkUser, getAuth } from "@clerk/express";
import { User } from "../infrastructure/entities/User";
import { createSolarUnitDto,UpdateSolarUnitDto } from "../domain/dtos/solar-unit";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../domain/error/errors";

// Extend Request type for Clerk auth
interface AuthRequest extends Request {
  auth?: {
    userId: string;
  };
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}



export const getAllSolarUnits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const solarUnits = await SolarUnit.find();
    res.status(200).json(solarUnits);
  } catch (error) {
    next(error);
  }
};

// export const createSolarUnit = async (req: Request, res: Response) => {
//   try {
//     const { serialNumber, installationDate, capacity, status } = req.body;

//     const newSolarUnit = {
//       serialNumber,
//       installationDate,
//       capacity,
//       status,
//     };

export const createSolarUnit = async (req: Request, res: Response) => {
  try {
    const result = createSolarUnitDto.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({ errors: result.error.issues });
    }
    
    const newSolarUnit = {
      serialNumber: result.data.serialNumber,
      installationDate: result.data.installationDate,
      capacity: result.data.capacity,
      status: result.data.status,
      userid: result.data.userid, // userid is now required
    };

    const createdSolarUnit = await SolarUnit.create(newSolarUnit);
    res.status(201).json(createdSolarUnit);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSolarUnitById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      return res.status(404).json({ message: "Solar unit not found" });
    }
    res.status(200).json(solarUnit);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSolarUnitValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = UpdateSolarUnitDto.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  next();
};

export const updateSolarUnit = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { serialNumber, installationDate, capacity, status,userId } = req.body;
  const solarUnit = await SolarUnit.findById(id);

  if (!solarUnit) {
    return res.status(404).json({ message: "Solar unit not found" });
  }

  const updatedSolarUnit = await SolarUnit.findByIdAndUpdate(id, {
    serialNumber,
    installationDate,
    capacity,
    status,
    userId
  });

  res.status(200).json(updatedSolarUnit);
};

export const deleteSolarUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      return res.status(404).json({ message: "Solar unit not found" });
    }

    await SolarUnit.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getSolarUnitsByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userid } = req.params;
    const solarUnits = await SolarUnit.find({ userid: userid });
    res.status(200).json(solarUnits);
  } catch (error) {
    next(error);
  }
};

export const getSolarUnitsByClerkUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { clerkUserId } = req.params;
    console.log(clerkUserId);
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const solarUnits = await SolarUnit.find({ userid: user._id });
    res.status(200).json(solarUnits[0]);
  } catch (error) {
    next(error);
  }
};

// Get solar unit for authenticated user (using Clerk middleware)
export const getSolarUnitForUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findOne({ clerkUserId: clerkUserId });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const solarUnit = await SolarUnit.findOne({ userid: user._id });
    if (!solarUnit) {
      throw new NotFoundError("Solar unit not found for user");
    }

    res.status(200).json(solarUnit);
  } catch (error) {
    next(error);
  }
};