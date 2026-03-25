     import { useState, useEffect } from 'react';

     export interface Order {
       order_sn: string;
       buyer_user_id: number;
       total_amount: number;
       order_status: string;
       create_time: string;
       update_time: string;
     }

     export const useShopeeOrders = () => {
       const [orders, setOrders] = useState<Order[]>([]);
       const [loading, setLoading] = useState(true);

       useEffect(() => {
         // Mock data (simula API Shopee)
         const mockOrders: Order[] = [
           {
             order_sn: '230424ABC123',
             buyer_user_id: 123456,
             total_amount: 89.90,
             order_status: 'READY_TO_SHIP',
             create_time: '2024-03-24T10:30:00Z',
             update_time: '2024-03-24T10:35:00Z',
           },
           {
             order_sn: '230424DEF456',
             buyer_user_id: 789012,
             total_amount: 45.50,
             order_status: 'SHIPPED',
             create_time: '2024-03-23T15:20:00Z',
             update_time: '2024-03-24T09:00:00Z',
           },
           {
             order_sn: '230424GHI789',
             buyer_user_id: 345678,
             total_amount: 120.00,
             order_status: 'CANCELLED',
             create_time: '2024-03-22T18:45:00Z',
             update_time: '2024-03-23T20:00:00Z',
           },
         ];
         setTimeout(() => {
           setOrders(mockOrders);
           setLoading(false);
         }, 1000); // Simula loading
       }, []);

       return { orders, loading };
     };