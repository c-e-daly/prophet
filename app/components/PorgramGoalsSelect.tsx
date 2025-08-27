import { EnumSelect } from "./EnumSelect";

type Props = {
  value: string | undefined;
  onChange: (val: string) => void;
  includeEmpty?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
};

export function ProgramGoalsSelect(props: Props) {
  return (
    <EnumSelect
      enumTypeName="program_goal"   // <-- your Postgres enum type name
      label="Program Goal"
      {...props}
    />
  );
}
