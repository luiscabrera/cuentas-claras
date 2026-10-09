import { Avatar } from '@/components/ui/Avatar';
import { Segmented } from '@/components/ui/Segmented';
import { dogForMember } from '@/features/households/active-household';
import type { Household } from '@/features/households/api';

export function PayerPicker({
  household,
  userId,
  value,
  onChange,
}: {
  household: Household;
  userId: string;
  value: string;
  onChange: (userId: string) => void;
}) {
  return (
    <Segmented
      accessibilityLabel="Quién pagó"
      value={value}
      onChange={onChange}
      options={household.members.map((member) => ({
        value: member.user_id,
        label: member.user_id === userId ? `${member.display_name} (vos)` : member.display_name,
        icon: (
          <Avatar
            dog={dogForMember(household, member.user_id)}
            name={member.display_name}
            size={26}
          />
        ),
      }))}
    />
  );
}
