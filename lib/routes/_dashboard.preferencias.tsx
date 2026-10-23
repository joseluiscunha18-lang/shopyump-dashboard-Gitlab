import {createFileRoute} from '@/lib/route-compat';
import {PageShell,PageHeader} from '@/components/demo/DemoKit';
import {useDashboardState,type DashboardLanguage} from '@/components/dashboard/DashboardState';
import {Sun,Moon,Monitor} from 'lucide-react';
import {Button} from '@/components/ui/ShopyumpButton';
import {useAccountT} from '@/lib/i18n/account';
export const Route=createFileRoute('/_dashboard/preferencias')({head:()=>({meta:[{title:'Preferências | Shopyump'},{name:'description',content:'Idioma e aparência do teu dashboard Shopyump.'},{property:'og:title',content:'Preferências | Shopyump'},{property:'og:description',content:'Idioma e aparência do teu dashboard Shopyump.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
const languages:{v:DashboardLanguage;label:string}[]=[{v:'pt',label:'Português'},{v:'en',label:'English'}];
function Page(){const {appearance,setAppearance,idioma,setIdioma}=useDashboardState();const t=useAccountT();
 const themes=[{v:'claro',label:t.light,icon:Sun},{v:'escuro',label:t.dark,icon:Moon},{v:'sistema',label:t.system,icon:Monitor}];
 return <PageShell><PageHeader title={t.preferences} subtitle={t.prefSubtitle}/>
 <section className="form-section"><h3>{t.language}</h3><div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.language}>{languages.map(l=><Button key={l.v} role="radio" aria-checked={idioma===l.v} variant={idioma===l.v?'primary':'secondary'} onClick={()=>setIdioma(l.v)}>{l.label}</Button>)}</div><p className="text-xs text-muted-foreground">{t.languageNote}</p></section>
 <section className="form-section"><h3>{t.appearance}</h3><div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.appearance}>{themes.map(x=><Button key={x.v} role="radio" aria-checked={appearance===x.v} variant={appearance===x.v?'primary':'secondary'} onClick={()=>setAppearance(x.v)}><x.icon size={16}/>{x.label}</Button>)}</div></section>
 </PageShell>}
