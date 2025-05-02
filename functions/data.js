const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://obkjucldecgowkwjtecb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ia2p1Y2xkZWNnb3drd2p0ZWNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTcwMzc0OSwiZXhwIjoyMDYxMjc5NzQ5fQ.4pa1KQdHH1jkVfzkHEANIenehvKzk_Ofy7Hc7211Bf8'
);

const PUSHER_APP_ID = '1962056';
const PUSHER_KEY = '8c2540a0c402d0c7aafe';
const PUSHER_SECRET = 'ap1';
const PUSHER_CLUSTER = '5e073f10327c3e87102e';
const IMGUR_CLIENT_ID = 'be0d52c6d1693d0';

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
                const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
                return {
                    statusCode: 200,
                    body: JSON.stringify(products)
                };

            case 'uploadProduct':
                await supabase.from('products').insert([{
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    date: data.date,
                    image: data.image,
                    sold_out: data.soldOut,
                    phone: data.phone
                }]);
                await triggerPusherEvent('products', 'productUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Product uploaded' })
                };

            case 'updateProduct':
                await supabase.from('products').update({
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    date: data.date,
                    image: data.image,
                    sold_out: data.soldOut,
                    phone: data.phone
                }).eq('id', data.id);
                await triggerPusherEvent('products', 'productUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Product updated' })
                };

            case 'deleteProduct':
                // First delete associated orders
                await supabase.from('orders').delete().eq('product_id', data.id);
                // Then delete the product
                await supabase.from('products').delete().eq('id', data.id);
                await triggerPusherEvent('products', 'productUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Product deleted' })
                };

            case 'placeOrder':
                await supabase.from('orders').insert([{
                    id: data.id,
                    product_id: data.productId,
                    product_name: data.productName,
                    product_image: data.productImage,
                    transaction_id: data.transactionId,
                    telegram_username: data.telegramUsername,
                    payment_method: data.paymentMethod,
                    shipping_address: data.shippingAddress,
                    status: data.status,
                    order_time: data.orderTime,
                    user_id: data.userId
                }]);
                await triggerPusherEvent('orders', 'newOrder', { order: data });
                await triggerPusherEvent(`orders-${data.userId}`, 'orderUpdated', { userId: data.userId });
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Order placed', order: data })
                };

            case 'getOrders':
                const { data: orders } = await supabase.from('orders').select('*').order('order_time', { ascending: false });
                return {
                    statusCode: 200,
                    body: JSON.stringify(orders)
                };

            case 'updateOrder':
                await supabase.from('orders').update({ status: data.status }).eq('id', data.id);
                await triggerPusherEvent(`orders-${data.userId}`, 'orderUpdated', { userId: data.userId });
                await triggerPusherEvent('orders', 'orderUpdated', {});
                
                // If order is approved, mark product as sold out
                if (data.status === 'အတည်ပြု' && data.productId) {
                    await supabase.from('products').update({ sold_out: true }).eq('id', data.productId);
                    await triggerPusherEvent('products', 'productUpdated', {});
                }
                
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Order updated' })
                };

            case 'createPost':
                await supabase.from('posts').insert([{
                    id: data.id,
                    title: data.title,
                    content: data.content,
                    image: data.image,
                    video: data.video,
                    author: data.author || 'Admin',
                    date: data.date || new Date().toISOString()
                }]);
                await triggerPusherEvent('posts', 'postUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Post created' })
                };

            case 'getPosts':
                const { data: posts } = await supabase.from('posts').select('*').order('date', { ascending: false });
                return {
                    statusCode: 200,
                    body: JSON.stringify(posts)
                };

            case 'updatePost':
                await supabase.from('posts').update({
                    title: data.title,
                    content: data.content,
                    image: data.image,
                    video: data.video
                }).eq('id', data.id);
                await triggerPusherEvent('posts', 'postUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Post updated' })
                };

            case 'deletePost':
                await supabase.from('posts').delete().eq('id', data.id);
                await triggerPusherEvent('posts', 'postUpdated', {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Post deleted' })
                };

            case 'createUser':
                await supabase.from('users').insert([{
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    password: data.password,
                    address: data.address
                }]);
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'User created' })
                };

            case 'getUsers':
                const { data: users } = await supabase.from('users').select('*');
                return {
                    statusCode: 200,
                    body: JSON.stringify(users)
                };

            case 'uploadImage':
                try {
                    const imageData = data.image;
                    const response = await fetch('https://api.imgur.com/3/image', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
                        },
                        body: imageData
                    });
                    const imgurData = await response.json();
                    if (imgurData.success) {
                        return {
                            statusCode: 200,
                            body: JSON.stringify({ link: imgurData.data.link })
                        };
                    } else {
                        throw new Error('Image upload failed');
                    }
                } catch (error) {
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ message: 'Image upload failed', error: error.message })
                    };
                }

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
