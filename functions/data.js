const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://mecpzriiiyxyxzbmqasy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lY3B6cmlpaXl4eXh6Ym1xYXN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjU5MTI2NywiZXhwIjoyMDU4MTY3MjY3fQ.uxv6Jq5zEJH3MLIPx7YJls5qdlCwiKajP9Lk57h7Jfg'
);

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

    try {
        switch (action) {
            case 'getProducts':
                const { data: products } = await supabase.from('products').select('*');
                return {
                    statusCode: 200,
                    body: JSON.stringify(products)
                };

            case 'uploadProduct':
                await supabase.from('products').insert([data]);
                await triggerPusherEvent('products', 'productUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Product uploaded' })
                };

            case 'deleteProduct':
                await supabase.from('products').delete().eq('id', data.id);
                await triggerPusherEvent('products', 'productUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Product deleted' })
                };

            case 'editProduct':
                await supabase.from('products').update({ name: data.name }).eq('id', data.id);
                await triggerPusherEvent('products', 'productUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Product edited' })
                };

            case 'placeOrder':
                await supabase.from('orders').insert([data]);
                await triggerPusherEvent('orders', 'newOrder', { order: data });
                await triggerPusherEvent(`orders-${data.userId}`, 'orderUpdated', { userId: data.userId });
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Order placed', order: data })
                };

            case 'getOrders':
                const userId = event.headers['user-id']; // Request header ကနေ userId ယူမယ်
                if (!userId) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ message: 'user-id header is required' })
                    };
                }
                const { data: orders } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('userId', userId); // userId နဲ့ filter လုပ်မယ်
                return {
                    statusCode: 200,
                    body: JSON.stringify(orders)
                };

            case 'updateOrder':
                await supabase.from('orders').update({ status: data.status }).eq('id', data.id);
                await triggerPusherEvent(`orders-${data.userId}`, 'orderUpdated', { userId: data.userId });
                await triggerPusherEvent('products', 'productUpdated', {});
                if (data.status === 'အတည်ပြု' && data.productId) {
                    await supabase.from('products').update({ soldOut: true }).eq('id', data.productId);
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Order updated' })
                };

            case 'markSoldOut':
                await supabase.from('products').update({ soldOut: true }).eq('id', data.productId);
                await triggerPusherEvent('products', 'productUpdated', {});
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
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Something went wrong', error: error.message })
        };
    }
};
