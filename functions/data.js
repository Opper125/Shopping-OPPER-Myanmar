const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Supabase client initialization
const supabase = createClient(
    'https://obkjucldecgowkwjtecb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ia2p1Y2xkZWNnb3drd2p0ZWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDM3NDksImV4cCI6MjA2MTI3OTc0OX0.KOtyYOwpE1GHGldFfVRxdflhyBaIDSN-ZQr7UEzb3Ao'
);

// Pusher configuration
const PUSHER_APP_ID = '1962056';
const PUSHER_KEY = '8c2540a0c402d0c7aafe';
const PUSHER_SECRET = '5e073f10327c3e87102e';
const PUSHER_CLUSTER = 'ap1';

/**
 * Trigger a Pusher event
 * @param {string} channel - The channel name
 * @param {string} event - The event name
 * @param {object} data - The data to send
 */
async function triggerPusherEvent(channel, event, data) {
    try {
        const url = `https://api-${PUSHER_CLUSTER}.pusher.com/apps/${PUSHER_APP_ID}/events`;
        const body = JSON.stringify({
            name: event,
            channel: channel,
            data: JSON.stringify(data)
        });
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PUSHER_SECRET}`
            },
            body: body
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Pusher API error:', errorText);
            throw new Error(`Pusher API error: ${response.status} ${response.statusText}`);
        }
        
        console.log(`Pusher event triggered: ${event} on channel ${channel}`);
        return true;
    } catch (error) {
        console.error('Error triggering Pusher event:', error);
        return false;
    }
}

/**
 * Main handler function for serverless function
 */
exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }
    
    try {
        // Parse request data
        const { action, ...data } = event.body 
            ? JSON.parse(event.body) 
            : { action: event.queryStringParameters.action };
        
        console.log(`Processing action: ${action}`);
        
        // Handle different actions
        switch (action) {
            case 'getProducts':
                const { data: products, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (productsError) throw productsError;
                
                console.log(`Retrieved ${products.length} products`);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(products)
                };

            case 'uploadProduct':
                // Add created_at timestamp
                const productData = {
                    ...data,
                    created_at: new Date().toISOString()
                };
                
                const { data: newProduct, error: uploadError } = await supabase
                    .from('products')
                    .insert([productData]);
                
                if (uploadError) throw uploadError;
                
                // Notify clients about the new product
                await triggerPusherEvent('products', 'productUpdated', {});
                
                console.log('Product uploaded successfully:', productData.id);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        message: 'Product uploaded successfully', 
                        product: productData 
                    })
                };

            case 'deleteProduct':
                const { error: deleteError } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', data.id);
                
                if (deleteError) throw deleteError;
                
                // Notify clients about the product deletion
                await triggerPusherEvent('products', 'productUpdated', {});
                
                console.log('Product deleted successfully:', data.id);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ message: 'Product deleted successfully' })
                };

            case 'editProduct':
                const { error: editError } = await supabase
                    .from('products')
                    .update(data.updates || { name: data.name })
                    .eq('id', data.id);
                
                if (editError) throw editError;
                
                // Notify clients about the product update
                await triggerPusherEvent('products', 'productUpdated', {});
                
                console.log('Product edited successfully:', data.id);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ message: 'Product edited successfully' })
                };

            case 'placeOrder':
                // Add created_at timestamp
                const orderData = {
                    ...data,
                    created_at: new Date().toISOString()
                };
                
                const { data: newOrder, error: orderError } = await supabase
                    .from('orders')
                    .insert([orderData]);
                
                if (orderError) throw orderError;
                
                // Notify admin about the new order
                await triggerPusherEvent('orders', 'newOrder', { order: orderData });
                
                // Notify the specific user about their order
                await triggerPusherEvent(`orders-${data.userId}`, 'orderUpdated', { userId: data.userId });
                
                console.log('Order placed successfully:', orderData.id);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        message: 'Order placed successfully', 
                        order: orderData 
                    })
                };

            case 'getOrders':
                const { data: orders, error: ordersError } = await supabase
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (ordersError) throw ordersError;
                
                console.log(`Retrieved ${orders.length} orders`);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(orders)
                };

            case 'updateOrder':
                const { error: updateOrderError } = await supabase
                    .from('orders')
                    .update({ 
                        status: data.status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', data.id);
                
                if (updateOrderError) throw updateOrderError;
                
                // Notify the specific user about their order update
                await triggerPusherEvent(`orders-${data.userId}`, 'orderUpdated', { userId: data.userId });
                
                // If order is approved, mark the product as sold out
                if (data.status === 'အတည်ပြု' && data.productId) {
                    const { error: markSoldOutError } = await supabase
                        .from('products')
                        .update({ soldOut: true })
                        .eq('id', data.productId);
                    
                    if (markSoldOutError) {
                        console.error('Error marking product as sold out:', markSoldOutError);
                    } else {
                        // Notify clients about the product update
                        await triggerPusherEvent('products', 'productUpdated', {});
                    }
                }
                
                console.log('Order updated successfully:', data.id);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ message: 'Order updated successfully' })
                };

            case 'markSoldOut':
                const { error: soldOutError } = await supabase
                    .from('products')
                    .update({ soldOut: true })
                    .eq('id', data.productId);
                
                if (soldOutError) throw soldOutError;
                
                // Notify clients about the product update
                await triggerPusherEvent('products', 'productUpdated', {});
                
                console.log('Product marked as sold out:', data.productId);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ message: 'Product marked as sold out' })
                };

            default:
                console.error('Invalid action:', action);
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'Invalid action' })
                };
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                message: 'Something went wrong', 
                error: error.message 
            })
        };
    }
};
