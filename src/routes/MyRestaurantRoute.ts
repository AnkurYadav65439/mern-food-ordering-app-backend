import express from "express";
import multer from "multer";
import MyRestaurantController from "../controllers/MyRestaurantController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyRestaurantRequest } from "../middleware/validation";

const router = express.Router();

//multer: takes file from request and stores in memory and then adds the file as an object to the request which then passed to the function 
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,    //5mb
    },
})

router.get("/", jwtCheck, jwtParse, MyRestaurantController.getMyRestaurant);
router.post("/", upload.single('imageFile'), validateMyRestaurantRequest, jwtCheck, jwtParse, MyRestaurantController.createMyRestaurant);
router.put("/", upload.single('imageFile'), validateMyRestaurantRequest, jwtCheck, jwtParse, MyRestaurantController.updateMyRestaurant);

export default router;