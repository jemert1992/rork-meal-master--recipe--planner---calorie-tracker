import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GroceryItem } from '@/types';
import { mockGroceryList } from '@/constants/mockData';

interface GroceryState {
  groceryItems: GroceryItem[];
  addItem: (item: Omit<GroceryItem, 'id'>) => void;
  removeItem: (id: string) => void;
  toggleChecked: (id: string) => void;
  clearCheckedItems: () => void;
  clearGroceryList: () => void;
  sortByCategory: () => GroceryItem[];
  setGroceryItems: (items: GroceryItem[]) => void;
}

export const useGroceryStore = create<GroceryState>()(
  persist(
    (set, get) => ({
      groceryItems: mockGroceryList,
      
      addItem: (item) => {
        const newItem = {
          ...item,
          id: Date.now().toString(),
        };
        
        set((state) => ({
          groceryItems: [...state.groceryItems, newItem],
        }));
      },
      
      removeItem: (id) => {
        set((state) => ({
          groceryItems: state.groceryItems.filter((item) => item.id !== id),
        }));
      },
      
      toggleChecked: (id) => {
        set((state) => ({
          groceryItems: state.groceryItems.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          ),
        }));
      },
      
      clearCheckedItems: () => {
        set((state) => ({
          groceryItems: state.groceryItems.filter((item) => !item.checked),
        }));
      },
      
      clearGroceryList: () => {
        set({ groceryItems: [] });
      },
      
      sortByCategory: () => {
        const items = [...get().groceryItems];
        return items.sort((a, b) => a.category.localeCompare(b.category));
      },
      
      setGroceryItems: (items) => {
        set({ groceryItems: items });
      },
    }),
    {
      name: 'grocery-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);