import {createFileRoute} from '@/lib/route-compat';
import {PageShell,PageHeader} from '@/components/demo/DemoKit';
import {ProfileForm} from '@/components/loja/ProfileForm';
import {useAccountT} from '@/lib/i18n/account';
export const Route=createFileRoute('/_dashboard/perfil')({head:()=>({meta:[{title:'Perfil | Shopyump'},{name:'description',content:'Fotografia, nome e telefone da tua conta Shopyump.'},{property:'og:title',content:'Perfil | Shopyump'},{property:'og:description',content:'Fotografia, nome e telefone da tua conta Shopyump.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){const t=useAccountT();return <PageShell><PageHeader title={t.profile} subtitle={t.profileSubtitle}/><ProfileForm/></PageShell>}
