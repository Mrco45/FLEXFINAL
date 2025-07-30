import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { db, storage } from '../src/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { AttachmentFile } from '../types';

// Helper to upload an image and return its download URL
export async function uploadImage(file: File): Promise<AttachmentFile> {
  const storageRef = ref(storage, `attachments/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    dataUrl: url,
  };
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time updates
    const q = query(collection(db, 'orders'), orderBy('orderDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Order[] = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }) as Order);
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const addOrder = useCallback(async (newOrder: Omit<Order, 'id' | 'totalCost'>) => {
    const totalCost = newOrder.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost) || 0), 0);
    await addDoc(collection(db, 'orders'), { ...newOrder, totalCost });
  }, []);

  const updateOrder = useCallback(async (updatedOrder: Order) => {
    const totalCost = updatedOrder.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.cost) || 0), 0);
    const orderRef = doc(db, 'orders', updatedOrder.id);
    await updateDoc(orderRef, { ...updatedOrder, totalCost });
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'orders', id));
  }, []);

  return { orders, addOrder, updateOrder, deleteOrder, loading };
};
