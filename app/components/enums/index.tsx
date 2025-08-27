import * as React from "react";
import { EnumSelect } from "../EnumSelect";

type Common = {
  value: string;
  onChange: (v: string) => void;
  includeEmpty?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
};

export const ProgramGoalSelect   = (p: Common) => <EnumSelect enumName="program_goal"   label="Program Goal"   {...p} />;
export const CampaignGoalSelect  = (p: Common) => <EnumSelect enumName="campaign_goal"  label="Campaign Goal"  {...p} />;
export const OfferStatusSelect   = (p: Common) => <EnumSelect enumName="offer_status"   label="Offer Status"   {...p} />;
export const CartStatusSelect    = (p: Common) => <EnumSelect enumName="cart_status"    label="Cart Status"    {...p} />;
export const ProgramStatusSelect = (p: Common) => <EnumSelect enumName="program_status" label="Program Status" {...p} />;
