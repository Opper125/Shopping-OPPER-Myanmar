const fetch = require('node-fetch');

const products = [];
const orders = [];

const PUSHER_APP_ID = '1962056';
const PUSHER_KEY = '8c2540a0c402d0c7aafe';
const PUSHER_SECRET = '5e073f10327c3e87102e';
const PUSHER_CLUSTER = 'ap1';

async function triggerPusherEvent(channel, event, data) {
    const url = `https://api-${PUSHER_CLUSTER}.pusher.com/apps/${PUSHER_APP_ID}/events`;
    const body = JSON.stringify({
        name: event,
        channel: channel,
        data: JSON.stringify(data)
    });
    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PUSHER_SECRET}`
        },
        body: body
    });
}

exports.handler = async (event, context) => {
    const { action, ...data } = event.body ? JSON.parse(event.body) : { action: event.queryStringParameters.action };

    switch (action) {
        case 'getProducts':
            return {
                statusCode: 200,
                body: JSON.stringify(products)
            };
        case 'uploadProduct':
            products.push(data);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Product uploaded' })
            };
        case 'deleteProduct':
            const productIndex = products.findIndex(p => p.id === data.id);
            if (productIndex !== -1) products.splice(productIndex, 1);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Product deleted' })
            };
        case 'editProduct':
            const product = products.find(p => p.id === data.id);
            if (product) product.name = data.name;
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Product edited' })
            };
        case 'placeOrder':
            orders.push(data);
            await triggerPusherEvent('orders', 'newOrder', { order: data });
            await triggerPusherEvent(`orders-${data.userId}`, 'orderUpdated', { userId: data.userId });
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Order placed', order: data })
            };
        case 'getOrders':
            return {
                statusCode: 200,
                body: JSON.stringify(orders)
            };
        case 'updateOrder':
            const order = orders.find(o => o.id === data.id);
            if (order) {
                order.status = data.status;
                await triggerPusherEvent(`orders-${data.userId}`, 'orderUpdated', { userId: data.userId });
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Order updated' })
            };
        case 'markSoldOut':
            const soldProduct = products.find(p => p.id === data.productId);
            if (soldProduct) soldProduct.soldOut = true;
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Product marked as sold out' })
            };
        default:
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid action' })
            };
    }
};
