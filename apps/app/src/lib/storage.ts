import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_HOUSEHOLD = 'cuentas-claras:hogar-activo';

/** El hogar activo se recuerda en el dispositivo (en la web, en localStorage). */
export const storage = {
  async getActiveHousehold(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_HOUSEHOLD);
    } catch {
      return null;
    }
  },
  async setActiveHousehold(id: string): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_HOUSEHOLD, id);
    } catch {
      // Si no se puede guardar, la próxima vez se usa el primer hogar: no es grave.
    }
  },
};
