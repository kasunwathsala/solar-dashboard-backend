import { createSolarUnitDto } from "../domain/dtos/solar-unit";
import { NotFoundError, ValidationError } from "../domain/error/errors";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";



export const getAllSolarUnits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const solarUnits = await SolarUnit.find();
    res.status(200).json(solarUnits);
  } catch (error) {
    // res.status(500).json({ message: "Internal server error" })
    //----------------uda peliya iwath kara yata peliya damaa atha-------------------------------
    next(error); // Pass the error to the global error handler
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

export const createsolarunitvalidator = async (req: Request, res: Response, next: NextFunction) => {
  const result = createSolarUnitDto.safeParse(req.body);

  if (!result.success) {
    // return res.status(400).json({ errors: result.error.issues });
    //----------------uda peliya iwath kara yata peliya damaa atha-------------------------------
    throw new ValidationError("Validation failed");
  }

  req.body = result.data;
  next();
};

// export const createSolarUnit = async (req: Request, res: Response) => {
//   try {
    
    // const result = createSolarUnitDto.safeParse(req.body)

    // if (!result.success) {
    //   return res.status(400).json({ errors: result.error.issues });
    // }
    

    //  const newSolarUnit = {
    //   serialNumber: result.data.serialNumber,
    //   installationDate: result.data.installationDate,
    //   capacity: result.data.capacity,
    //   status: result.data.status,
    //   userid: result.data.userid, // userid is now required
    // };

    export const createSolarUnit = async (req: Request, res: Response, next: NextFunction) => {
  try {

//uda try eka athule thibuna tika iwath kara meka dala newsolarunit eka yatathe thibba ewage result wachne iwath karaa--



    const data: z.infer<typeof createSolarUnitDto> = req.body;
    
    const newSolarUnit = {
      serialNumber: data.serialNumber,
      installationDate: data.installationDate,
      capacity: data.capacity,
      status: data.status,
      userid: data.userid, // userid is now required
    };

    const createdSolarUnit = await SolarUnit.create(newSolarUnit);
    res.status(201).json(createdSolarUnit);
  } catch (error) {
    // res.status(500).json({ message: "Internal server error" });
    //----------------uda peliya iwath kara yata peliya damaa atha-------------------------------
    next(error); // Pass the error to the global error handler
  }
};

export const getSolarUnitById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      // return res.status(404).json({ message: "Solar unit not found" });
      //----------------uda peliya iwath kara yata peliya damaa atha-------------------------------
      throw new NotFoundError("Solar unit not found");
    }
    res.status(200).json(solarUnit);
  } catch (error) {
    // res.status(500).json({ message: "Internal server error" });
    //----------------uda peliya iwath kara yata peliya damaa atha-------------------------------
    next(error);
  }
};
// export const updateSolarUnit = async (req: Request, res: Response) => {
//-----------uda eka wenuwata next dala pahala eka--------------------------------------
export const updateSolarUnit = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { serialNumber, installationDate, capacity, status } = req.body;
  const solarUnit = await SolarUnit.findById(id);

  if (!solarUnit) {
    // return res.status(404).json({ message: "Solar unit not found" })
    //----------------uda peliya iwath kara yata peliya damaa atha-------------------------------
    throw new NotFoundError("Solar unit not found");
  }

  const updatedSolarUnit = await SolarUnit.findByIdAndUpdate(id, {
    serialNumber,
    installationDate,
    capacity,
    status,
  });

  res.status(200).json(updatedSolarUnit);
};

// export const deleteSolarUnit = async (req: Request, res: Response) => {
//---------uda eka wenuwata next dala pahala eka--------------------------------------
export const deleteSolarUnit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const solarUnit = await SolarUnit.findById(id);

    if (!solarUnit) {
      // return res.status(404).json({ message: "Solar unit not found" });
      //----------------uda peliya iwath kara yata peliya damaa atha-------------------------------
      throw new NotFoundError("Solar unit not found");
    }

    await SolarUnit.findByIdAndDelete(id);
    res.status(204).send();
  } catch (error) {
    // res.status(500).json({ message: "Internal server error" });
    //----------------uda peliya iwath kara yata peliya damaa atha-------------------------------
    next(error);
  }
};
