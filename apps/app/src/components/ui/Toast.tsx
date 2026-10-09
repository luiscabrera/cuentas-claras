import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastApi = { show: (message: string) => void };

const ToastContext = createContext<ToastApi>({ show: () => {} });

/** Avisos cortos arriba de la pantalla ("Gasto guardado"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), 2600);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 items-center px-5"
          style={{ top: insets.top + 12 }}
        >
          {/* Animated.View no toma className: el estilo va en el View de adentro. */}
          <Animated.View entering={FadeInUp.duration(180)} exiting={FadeOutUp.duration(180)}>
            <View
              testID="toast"
              accessibilityLiveRegion="polite"
              role="alert"
              className="flex-row items-center rounded-full bg-tinta px-5 py-3 shadow-lg"
            >
              <Text className="text-[15px] font-medium text-white">{message}</Text>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
