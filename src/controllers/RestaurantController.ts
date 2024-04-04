import { Request, Response } from "express"
import Restaurant from "../models/restaurant";


export const getRestaurant = async (req: Request, res: Response) => {
    try {
        const restaurandId = req.params.restaurandId;

        const restaurant = await Restaurant.findById(restaurandId);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json(restaurant);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}

export const searchRestaurants = async (req: Request, res: Response) => {
    try {
        const city = req.params.city;

        //queries(filtering, sorting) if available
        const searchQuery = req.query.searchQuery as string || '';
        const selectedCuisines = req.query.selectedCuisines as string || '';
        const sortOptions = req.query.sortOption as string || 'lastUpdated';
        const page = parseInt(req.query.page as string) || 1;    //as params came as string 

        let query: any = {};

        query["city"] = new RegExp(city, 'i');
        const cityCheck = await Restaurant.countDocuments(query);

        if (cityCheck === 0) {
            return res.status(404).json({
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    pages: 1
                }
            });
        }

        if (selectedCuisines) {
            const cusisinesArray = selectedCuisines.split(",").map((cuisine) => new RegExp(cuisine, "i"));
            query["cuisines"] = { $all: cusisinesArray };
        }

        if (searchQuery) {
            const searchRegex = new RegExp(searchQuery, "i");
            query["$or"] = [
                { restaurantName: searchRegex },
                { cuisines: { $in: searchRegex } },
            ]
        }

        const pageSize = 10;
        const skip = (page - 1) * pageSize;

        const restaurants = await Restaurant.find(query).sort({ [sortOptions]: 1 }).skip(skip).limit(pageSize);

        const total = await Restaurant.countDocuments(query);

        const response = {
            data: restaurants,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / pageSize)
            }
        };

        res.json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}

export default {
    getRestaurant,
    searchRestaurants
}