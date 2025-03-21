const products = [];
const orders = [];

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
            const orderedProduct = products.find(p => p.id === data.productId);
            if (orderedProduct) {
                orders.push({
                    id: Date.now().toString(),
                    productName: orderedProduct.name,
                    ...data
                });
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Order placed' })
            };
        case 'getOrders':
            return {
                statusCode: 200,
                body: JSON.stringify(orders)
            };
        case 'updateOrder':
            const order = orders.find(o => o.id === data.id);
            if (order) order.status = data.status;
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Order updated' })
            };
        default:
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid action' })
            };
    }
};
