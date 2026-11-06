'use client';

import { House } from 'lucide-react';
import {
  House as PhHouse, Package, ClipboardText, ChartBar, Users, Eye, PencilSimpleLine, Megaphone, Gear,
  CreditCard, Lifebuoy, List, Bell, Storefront, PencilSimple, Copy, Palette, User, ShieldCheck,
  SlidersHorizontal, SignOut, Plus,
  type Icon as PhosphorIcon, type IconProps,
} from '@phosphor-icons/react';

/**
 * Ícones da interface: família Phosphor (uma só família em todo o lado).
 *
 * Cada ícone aceita `weight`: 'regular' (contorno) quando está inativo e 'fill' (preenchido) quando
 * está ativo — ver BottomNav e Sidebar. Tamanho por omissão 24px; width/height/className continuam a
 * funcionar como antes. Os nomes exportados não mudaram, por isso quem já os importava não precisa de alterações.
 */
function ph(Icon: PhosphorIcon) {
  return function NavigationIcon(props: IconProps) {
    return <Icon size={24} aria-hidden="true" {...props} />;
  };
}

// Mantido por compatibilidade: exportação antiga do ícone House da Lucide.
export { House };

export const HomeIcon = ph(PhHouse);
export const ProductsIcon = ph(Package);
export const OrdersIcon = ph(ClipboardText);
export const AnalyticsIcon = ph(ChartBar);
export const CustomersIcon = ph(Users);
export const ViewStoreIcon = ph(Eye);
export const CustomizeIcon = ph(PencilSimpleLine);
export const MarketingIcon = ph(Megaphone);
export const SettingsIcon = ph(Gear);
export const BillingIcon = ph(CreditCard);
export const SupportIcon = ph(Lifebuoy);
export const MenuIcon = ph(List);
export const BellIcon = ph(Bell);
export const StoreIcon = ph(Storefront);
export const PencilIcon = ph(PencilSimple);
export const CopyIcon = ph(Copy);
export const PaletteIcon = ph(Palette);
export const UserIcon = ph(User);
export const ShieldIcon = ph(ShieldCheck);
export const SlidersIcon = ph(SlidersHorizontal);
export const LogOutIcon = ph(SignOut);
export const PlusIcon = ph(Plus);
