// services/cartApi.js
const BASE_URL = 'https://api1.suratec.co.th';

const cartApi = {
    // Create Cart
    createCart: async (idCustomer, doctorId, hospitalId, addNote) => {
        try {
            const response = await fetch(`${BASE_URL}/cart/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_customer: idCustomer,
                    doctor_id: doctorId,
                    hospital_id: hospitalId,
                    add_note: addNote,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Create cart error:', error);
            throw error;
        }
    },

    // Add Item to Cart
    addItemToCart: async (cartId, productId, price, quantity, size) => {
        try {
            const response = await fetch(`${BASE_URL}/cart/item/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cart_id: cartId,
                    product_id: productId,
                    price: price,
                    quantity: quantity,
                    size: size,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Add item to cart error:', error);
            throw error;
        }
    },

    // Confirm Order
    confirmOrder: async (cartId, customerId, doctorId, hospitalId, totalPrice, addNote) => {
        try {
            const response = await fetch(`${BASE_URL}/order/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cart_id: cartId,
                    customer_id: customerId,
                    doctor_id: doctorId,
                    hospital_id: hospitalId,
                    totalprice: totalPrice,
                    playback_type: "",
                    datetimepicker: "",
                    product_type: "",
                    playback_time: "",
                    chappal_csv_dropdown: "",
                    add_note: addNote,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Confirm order error:', error);
            throw error;
        }
    },
};

export default cartApi;