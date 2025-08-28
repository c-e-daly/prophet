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

export const ProgramGoalSelect   = (p: Common) => <EnumSelect enumKey="program_goal"   label="Program Goal"   {...p} />;
export const CampaignGoalSelect  = (p: Common) => <EnumSelect enumKey="campaign_goal"  label="Campaign Goal"  {...p} />;
export const OfferStatusSelect   = (p: Common) => <EnumSelect enumKey="offer_status"   label="Offer Status"   {...p} />;
export const CartStatusSelect    = (p: Common) => <EnumSelect enumKey="cart_status"    label="Cart Status"    {...p} />;
export const ProgramStatusSelect = (p: Common) => <EnumSelect enumKey="program_status" label="Program Status" {...p} />;
export const CampaignStatusSelect = (p: Common) => <EnumSelect enumKey="campaign_status" label="Campaign Status" {...p} />;
