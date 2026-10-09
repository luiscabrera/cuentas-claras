import { Pressable, Text, View } from 'react-native';

import type { Category } from '../api';

export function CategoryPicker({
  categories,
  value,
  onChange,
  error,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  return (
    <View className="gap-2">
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Categoría"
        className="flex-row flex-wrap gap-2"
      >
        {categories.map((category) => {
          const selected = category.id === value;
          return (
            <Pressable
              key={category.id}
              testID={`category-${category.name}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={category.name}
              onPress={() => onChange(category.id)}
              className={`min-h-[44px] flex-row items-center gap-2 rounded-full px-4 ${
                selected
                  ? 'border-2 border-fuego-500 bg-fuego-50'
                  : 'border border-cielo-200 bg-white active:bg-cielo-100'
              }`}
            >
              {category.icon ? <Text className="text-[18px]">{category.icon}</Text> : null}
              <Text
                className={`text-[15px] ${selected ? 'font-semibold text-fuego-700' : 'text-tinta-700'}`}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text className="text-[14px] text-error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
