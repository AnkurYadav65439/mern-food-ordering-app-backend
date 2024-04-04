import Stripe from "stripe";
import { Request, Response } from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";
import Order from "../models/order";

const STRIPE = new Stripe(process.env.STRIPE_API_KEY as string);
const FRONTEND_URL = process.env.FRONTEND_URL as string;
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

type CheckoutSessionRequest = {
    cartItems: {
        menuItemId: string;
        name: string;
        quantity: string;
        //later convert into no. and no price sent due to security mainly, we fetch upto date price at backend
    }[];
    deliveryDetails: {
        email: string;
        name: string;
        addressLine1: string;
        city: string;
    };
    restaurantId: string;
}

//1
//used to recieve events from 3rd party(stripe), all for stripe cli on local machine to connect stripe.com(development)
const stripeWebhookHandler = async (req: Request, res: Response) => {
    let event;
    try {
        const sig = req.headers["stripe-signature"];
        console.log("signature is ", sig);
        event = STRIPE.webhooks.constructEvent(
            req.body,
            sig as string,
            STRIPE_ENDPOINT_SECRET
        );
    } catch (error: any) {
        console.log(error);
        return res.status(400).send(`Webhook error: ${error.message}`)
    }

    //out of many events send by stripe, we only handled this event 
    if (event.type === "checkout.session.completed") {
        const order = await Order.findById(event.data.object.metadata?.orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.totalAmount = event.data.object.amount_total;
        order.status = "paid";

        await order.save();
    }

    res.status(200).send();
}

//2
const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const checkoutSessionRequest: CheckoutSessionRequest = req.body;
        console.log("checkoutsesison data : ", checkoutSessionRequest);

        const restaurant = await Restaurant.findById(checkoutSessionRequest.restaurantId);

        if (!restaurant) {
            throw new Error("Restaurant not found");
        }
        //(changing restaurant model)

        //creating order in our db
        const order = new Order({
            restaurant: restaurant._id,
            user: req.userId,
            status: "placed",
            deliveryDetails: checkoutSessionRequest.deliveryDetails,
            cartItems: checkoutSessionRequest.cartItems,
        });

        //line items[] is for stripe accepted format
        const lineItems = createLineItems(checkoutSessionRequest, restaurant.menuItems);

        //creating stripe session
        const session = await createSession(lineItems, order._id.toString(), restaurant.deliveryPrice, restaurant._id.toString());

        //returned url of the hosted page on stripe(very imp)
        if (!session.url) {
            return res.status(500).json({ message: "Error creating stripe session" })
        }

        await order.save();
        res.json({ url: session.url });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.raw.message });
    }
};

const createLineItems = (checkoutSessionRequest: CheckoutSessionRequest, menuItems: MenuItemType[]) => {
    const lineItems = checkoutSessionRequest.cartItems.map((cartItem) => {
        const menuItem = menuItems.find((item) => item._id.toString() === cartItem.menuItemId.toString());

        if (!menuItem) {
            throw new Error("Menu item not found");
        }

        const line_item: Stripe.Checkout.SessionCreateParams.LineItem = {
            price_data: {
                currency: "gbp",
                unit_amount: menuItem.price,
                product_data: {
                    name: menuItem.name,
                },
            },
            quantity: parseInt(cartItem.quantity),
        };

        return line_item;
    });

    return lineItems;
}

const createSession = async (
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    orderId: string,
    deliveryPrice: number,
    restaurantId: string
) => {
    const sessionData = await STRIPE.checkout.sessions.create({
        line_items: lineItems,
        shipping_options: [
            {
                shipping_rate_data: {
                    display_name: "Delivery",
                    type: "fixed_amount",
                    fixed_amount: {
                        amount: deliveryPrice,
                        currency: "gbp",
                    },
                },
            },
        ],
        mode: "payment",
        metadata: {
            orderId,
            restaurantId,
        },
        success_url: `${FRONTEND_URL}`,
        cancel_url: `${FRONTEND_URL}`
    });

    return sessionData;
}

export default {
    createCheckoutSession,
    stripeWebhookHandler
}