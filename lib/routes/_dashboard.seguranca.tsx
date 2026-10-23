import {createFileRoute} from '@/lib/route-compat';
import {PageShell,PageHeader} from '@/components/demo/DemoKit';
import {SecurityForm} from '@/components/loja/SecurityForm';
import {useAccountT} from '@/lib/i18n/account';
export const Route=createFileRoute('/_dashboard/seguranca')({head:()=>({meta:[{title:'Segurança | Shopyump'},{name:'description',content:'Palavra-passe e email de acesso da tua conta Shopyump.'},{property:'og:title',content:'Segurança | Shopyump'},{property:'og:description',content:'Palavra-passe e email de acesso da tua conta Shopyump.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){const t=useAccountT();return <PageShell><PageHeader title={t.security} subtitle={t.securitySubtitle}/><SecurityForm/></PageShell>}
