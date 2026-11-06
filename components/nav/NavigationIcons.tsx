import { House, Bell, Pencil, Store, Palette, type LucideProps, type LucideIcon } from 'lucide-react';

/** Black outline with a white interior. */
function outlined(Icon: LucideIcon) {
  return function OutlinedIcon(props: LucideProps) {
    return <Icon fill="var(--card, #fff)" strokeWidth={2} aria-hidden="true" {...props} />;
  };
}

/** Filled silhouette with a contrasting doorway, matching the supplied reference. */
export function HomeIcon(props: LucideProps) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M2 10.5 11.1 3a1.4 1.4 0 0 1 1.8 0l9.1 7.5" />
    <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-7-6Z" fill="currentColor" />
    <path d="M9.5 16.5h5" className="home-icon-door" />
  </svg>;
}

export { House };

/** Compact filled silhouettes, sharing HomeIcon's rounded geometry and weight. */
function silhouette(path: string) {
  return function NavigationIcon(props: LucideProps) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" {...props}><path d={path} fillRule="evenodd" clipRule="evenodd" /></svg>;
  };
}

/** Caixa/pacote: tampa superior + corpo, com fita central. */
export const ProductsIcon = silhouette('M11.1 1.7a2 2 0 0 1 1.8 0l7.6 3.8L12 9.8 3.5 5.5l7.6-3.8ZM2.5 7.2 11 11.5V22l-7.4-3.7A2 2 0 0 1 2.5 16.5V7.2Zm19 0v9.3a2 2 0 0 1-1.1 1.8L13 22V11.5l8.5-4.3Z');
export const OrdersIcon = silhouette('M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2Zm2 0v2h4V4h-4ZM8 10v2h8v-2H8Zm0 5v2h6v-2H8Z');
export const AnalyticsIcon = silhouette('M3 13a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v7H3v-7Zm6-6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v13H9V7Zm6-3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v16h-5V4Z');
export const CustomersIcon = silhouette('M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 20v-1a8 6 0 0 1 16 0v1H4ZM19 4a3 3 0 0 1 0 6c1-2 1-4 0-6Zm2 9c2 1 3 3 3 6v1h-2v-1c0-2-1-4-1-6Z');
export const ViewStoreIcon = silhouette('M1 12c5-9 17-9 22 0-5 9-17 9-22 0Zm11-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z');
export const CustomizeIcon = silhouette('m16 3 5 5-12 12-6 1 1-6L16 3Zm-1 4 2 2 1-1-2-2-1 1Z');
export const MarketingIcon = silhouette('M18 3a1 1 0 0 1 2 0v16a1 1 0 0 1-2 0v-1l-7-3H9l1 5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1l-1-5H5a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3h6l7-3V3Zm3 6a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1Z');
export const SettingsIcon = silhouette('m10 2-1 3-2 1-3-1-2 4 2 2v2l-2 2 2 4 3-1 2 1 1 3h4l1-3 2-1 3 1 2-4-2-2v-2l2-2-2-4-3 1-2-1-1-3h-4Zm2 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z');
export const BillingIcon = silhouette('M4 4h16a2 2 0 0 1 2 2v2H2V6a2 2 0 0 1 2-2ZM2 11h20v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7Zm3 4v2h5v-2H5Z');
export const SupportIcon = silhouette('M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-3 7h2c0-2 3-2 3 0 0 1-3 1-3 4h2c0-2 3-2 3-4 0-5-7-5-7 0Zm2 6v2h2v-2h-2Z');
export const MenuIcon = silhouette('M3 6a1.25 1.25 0 0 1 1.25-1.25h15.5a1.25 1.25 0 0 1 0 2.5H4.25A1.25 1.25 0 0 1 3 6Zm0 6a1.25 1.25 0 0 1 1.25-1.25h15.5a1.25 1.25 0 0 1 0 2.5H4.25A1.25 1.25 0 0 1 3 12Zm0 6a1.25 1.25 0 0 1 1.25-1.25h15.5a1.25 1.25 0 0 1 0 2.5H4.25A1.25 1.25 0 0 1 3 18Z');
export const BellIcon = outlined(Bell);
export const StoreIcon = outlined(Store);
export const PencilIcon = outlined(Pencil);
export const CopyIcon = silhouette('M9 2h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1V8a3 3 0 0 0-3-3H7V4a2 2 0 0 1 2-2ZM6 7h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z');
export const PaletteIcon = outlined(Palette);
export const UserIcon = silhouette('M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM3 21a9 7 0 0 1 18 0v1H3v-1Z');
export const ShieldIcon = silhouette('M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.4-3.3-3.3 1.4-1.4 1.9 1.9 4.4-4.4 1.4 1.4-5.8 5.8Z');
export const SlidersIcon = silhouette('M4 6a1 1 0 0 1 1-1h7.2a3 3 0 0 1 5.6 0H19a1 1 0 1 1 0 2h-1.2a3 3 0 0 1-5.6 0H5a1 1 0 0 1-1-1Zm0 12a1 1 0 0 1 1-1h1.2a3 3 0 0 1 5.6 0H19a1 1 0 1 1 0 2h-7.2a3 3 0 0 1-5.6 0H5a1 1 0 0 1-1-1Z');
export const LogOutIcon = silhouette('M5 3h7a2 2 0 0 1 2 2v3h-2V5H5v14h7v-3h2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm11.3 4.3L21 12l-4.7 4.7-1.4-1.4 2.3-2.3H9v-2h8.2l-2.3-2.3 1.4-1.4Z');
