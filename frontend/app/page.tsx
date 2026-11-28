 "use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Menu, X, Utensils, ChefHat, CalendarDays, ClipboardCheck, Users, ChartNoAxesCombined, Sparkles, Mail, Phone, MapPin, Instagram, Facebook, Linkedin, CheckCircle2, ChevronLeft, ChevronRight, Flame, Coffee, Soup, PartyPopper } from "lucide-react";
import { API_BASE_URL } from "../lib/api";

const slides = [
 { kicker:"FOOD · PEOPLE · EXPERIENCES", title:"Every gathering deserves a", accent:"beautiful menu.", copy:"From a relaxed breakfast to a grand celebration, bring every food detail together in one simple place.", image:"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=2000&q=88", alt:"Grilled food prepared for a gathering", caption:"Thoughtfully planned. Beautifully served." },
 { kicker:"MAKE EVERY MEAL COUNT", title:"Plan the menu. Manage", accent:"the moments.", copy:"Coordinate guest choices, kitchen teams and suppliers without losing sight of the details.", image:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=88", alt:"Elegant dinner table for an event", caption:"A smoother way to host." },
 { kicker:"ONE PLATFORM · EVERY OCCASION", title:"Good food brings everyone", accent:"closer together.", copy:"Make breakfast, private dining, BBQs and special events easier to organise from start to finish.", image:"https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=2000&q=88", alt:"Fresh food arranged for sharing", caption:"Your event, your menu, your way." }
];
const services = [
 [CalendarDays,"Guest & booking management","Create bookings, invite guests and collect stay details and meal requirements in one place."],
 [Utensils,"Custom menu planning","Let guests choose breakfast, lunch, dinner, tea time and event menus that suit their occasion."],
 [ChefHat,"Kitchen coordination","Share approved menus and ingredient quantities with chefs and kitchen teams with clarity."],
 [ClipboardCheck,"Supplier & costing","Track ingredient prices, supplier confirmations and actual food costs for every booking."],
 [ChartNoAxesCombined,"Reports & insights","Review estimated costs, final spending and balances, then export reports for your records."],
 [Sparkles,"Smart food organisation","Use AI-assisted ingredient grouping to make preparation lists easier to review and manage."]
] as const;
const occasions = [
 ["START THE DAY","Breakfast moments","Fresh, relaxed and made to order.","https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=85",Coffee],
 ["GATHER AROUND","Lunch & dinner","Memorable meals for every guest.","https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1100&q=8",Soup],
 ["FIRE UP THE FUN","BBQ celebrations","Bring people together over the grill.","https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=85",Flame],
 ["MAKE IT SPECIAL","Events & functions","Thoughtful menus for life's big days.","https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85",PartyPopper]
] as const;
export default function Home() {
 const router=useRouter();
 const [slideIndex,setSlideIndex]=useState(0), [mobile,setMobile]=useState(false), [sent,setSent]=useState(false), [authMode,setAuthMode]=useState<"signin"|"signup"|null>(null), [authMessage,setAuthMessage]=useState(""), [authLoading,setAuthLoading]=useState(false), [getStartedLoading,setGetStartedLoading]=useState(false);
 useEffect(()=>{const t=window.setInterval(()=>setSlideIndex(v=>(v+1)%slides.length),5500);return()=>window.clearInterval(t)},[]);
 useEffect(()=>{
  if(!authMode)return;
  const previousOverflow=document.body.style.overflow;
  const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setAuthMode(null)};
  document.body.style.overflow="hidden";
  window.addEventListener("keydown",closeOnEscape);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener("keydown",closeOnEscape)};
 },[authMode]);
 const openAuth=(mode:"signin"|"signup")=>{setAuthMode(mode);setAuthMessage("");setMobile(false)};
 const handleGetStarted=async()=>{
  setGetStartedLoading(true);
  try {
   const response=await fetch(`${API_BASE_URL}/auth/me`,{credentials:"include"});
   const result:{user?:{id?:string}}=await response.json();
   if(response.ok&&result.user?.id){
    router.push("/dashboard");
    router.refresh();
    return;
   }
   openAuth("signin");
  } catch {
   openAuth("signin");
  } finally {
   setGetStartedLoading(false);
  }
 };
 const slide=slides[slideIndex];
 return <main>
  <header className="header">
   <a className="brand" href="#home"><span className="brand-icon"><Utensils size={21}/></span><span className="brand-title">Menu<span>Pilot</span><small>FOOD & EVENT MANAGEMENT</small></span></a>
   <nav className={mobile?"nav open":"nav"}>{["Home","About","Services","Occasions","Contact"].map((x)=><a key={x} href={"#"+x.toLowerCase()} onClick={()=>setMobile(false)}>{x}</a>)}<button className="nav-auth" onClick={()=>openAuth("signin")}>Sign In</button><button className="nav-auth auth-signup" onClick={()=>openAuth("signup")}>Sign Up</button></nav>
   <div className="header-auth"><button className="auth-signin" onClick={()=>openAuth("signin")}>Sign In</button><button className="auth-signup" onClick={()=>openAuth("signup")}>Sign Up</button></div>
   <button className="mobile-toggle" onClick={()=>setMobile(!mobile)} aria-label="Toggle navigation">{mobile?<X/>:<Menu/>}</button>
  </header>

  <section className="hero" id="home">
   {slides.map((s,i)=><div key={s.kicker} className={"hero-photo "+(i===slideIndex?"active":"")} style={{backgroundImage:`url("${s.image}")`}} role="img" aria-label={s.alt}/>)}
   <div className="hero-overlay"/>
   <div className="hero-copy" key={slideIndex}><div className="eyebrow light"><i/>{slide.kicker}</div><h1>{slide.title}<br/><em>{slide.accent}</em></h1><p>{slide.copy}</p><div className="hero-buttons"><button className="btn primary" type="button" onClick={handleGetStarted} disabled={getStartedLoading}>{getStartedLoading?"Checking...":"Get started"} <ArrowRight size={17}/></button><a className="explore" href="#occasions">Explore occasions <span>↗</span></a></div></div>
   <div className="hero-footer"><span>{slide.caption}</span><div className="slider"><b>0{slideIndex+1} <i>/ 0{slides.length}</i></b><button onClick={()=>setSlideIndex((slideIndex+slides.length-1)%slides.length)} aria-label="Previous slide"><ChevronLeft/></button><button onClick={()=>setSlideIndex((slideIndex+1)%slides.length)} aria-label="Next slide"><ChevronRight/></button></div></div>
   <div className="dots">{slides.map((s,i)=><button key={s.kicker} className={i===slideIndex?"chosen":""} onClick={()=>setSlideIndex(i)} aria-label={`Slide ${i+1}`}/>)}</div>
  </section>

  <div className="trust"><div><Users/>Guest-focused planning</div><i/><div><ChefHat/>Connected kitchen teams</div><i/><div><ChartNoAxesCombined/>Clear food costing</div><i/><div><CheckCircle2/>Smoother event operations</div></div>

  <section className="about wrap" id="about">
   <div className="about-pics"><img className="about-main" src="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1100&q=85" alt="Chef arranging an event buffet"/><img className="about-small" src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=85" alt="Restaurant dining table"/><div className="round-note"><b>One</b><span>connected<br/>food journey</span><Utensils/></div></div>
   <div className="about-text"><div className="eyebrow"><i/>ABOUT MENUPILOT</div><h2>Great hospitality starts <em>behind the scenes.</em></h2><p className="lead">MenuPilot brings guest menu selection, food preparation, supplier coordination and costing together in one organised platform.</p><p>Whether you're managing a hotel stay, a private villa, a catering service or a special function, MenuPilot helps your team stay connected from the first guest request to the final food-cost report.</p><div className="checks"><div><CheckCircle2/>One clear place for every meal request</div><div><CheckCircle2/>Better coordination between managers and chefs</div><div><CheckCircle2/>Ingredient quantities and costs you can track</div></div><a className="under-link" href="#services">Discover what we do <ArrowRight/></a></div>
  </section>

  <section className="services" id="services"><div className="wrap"><div className="section-title centered"><div className="eyebrow"><i/>WHAT MENUPILOT CAN DO</div><h2>Everything your food operation needs, <em>working together.</em></h2><p>From the guest's first menu choice to the kitchen's final costing, keep every step connected.</p></div>
   <div className="service-grid">{services.map(([Icon,title,copy],i)=><article className="service-card" key={title}><div className="service-top"><span><Icon/></span><b>0{i+1}</b></div><h3>{title}</h3><p>{copy}</p><a href="#contact" aria-label={`Ask about ${title}`}><ArrowUpRight/></a></article>)}</div>
  </div></section>

  <section className="occasions wrap" id="occasions"><div className="occasion-heading"><div><div className="eyebrow"><i/>MADE FOR EVERY OCCASION</div><h2>What's on <em>your table?</em></h2></div><p>Different moments call for different menus. Plan them all with the same thoughtful approach.</p></div>
   <div className="occasion-grid">{occasions.map(([tag,title,copy,image,Icon],i)=><article className="occasion-card" key={title}><div className="occasion-image"><img src={image} alt={title}/><b>0{i+1}</b></div><div className="occasion-info"><small>{tag}</small><div><h3>{title}</h3><Icon/></div><p>{copy}</p></div></article>)}</div>
  </section>

  <section className="quote"><div className="quote-inner"><b>“</b><div><p>Good food is only the beginning. Great experiences happen when every detail comes together.</p><small>THE MENUPILOT APPROACH</small></div><a href="#contact"><ArrowUpRight/></a></div></section>

  <section className="contact wrap" id="contact"><div className="contact-text"><div className="eyebrow"><i/>LET'S CONNECT</div><h2>Have a question? <em>We're here to help.</em></h2><p>Want to know more about MenuPilot or explore how it could support your food and event operations? Send us a message.</p><div className="contact-list"><div><span><Mail/></span><section><small>EMAIL US</small><b>hello@menupilot.com</b></section></div><div><span><Phone/></span><section><small>CALL OUR TEAM</small><b>+94 11 234 5678</b></section></div><div><span><MapPin/></span><section><small>OUR LOCATION</small><b>Sri Lanka</b></section></div></div></div>
   <form className="contact-form" onSubmit={e=>{e.preventDefault();setSent(true)}}><h3>Send us a message</h3><p>We'd love to hear from you.</p><label>Your name<input required placeholder="Enter your name"/></label><label>Email address<input required type="email" placeholder="you@example.com"/></label><label>How can we help?<textarea required rows={4} placeholder="Tell us a little about what you need..."/></label><button className="btn primary" type="submit">{sent?"Message noted":"Send message"} {sent?<CheckCircle2/>:<ArrowRight/>}</button>{sent&&<small className="success">Thanks! Connect this demo form to your backend to receive messages.</small>}<small className="form-note">Demo contact form · Backend integration required.</small></form>
  </section>

  <footer className="footer"><div className="footer-main"><div className="footer-about"><a className="brand footer-brand" href="#home"><span className="brand-icon"><Utensils/></span><span className="brand-title">Menu<span>Pilot</span><small>FOOD & EVENT MANAGEMENT</small></span></a><p>Bringing guest menus, kitchen teams and food costing together — so you can focus on creating memorable experiences.</p><div className="social"><a href="#contact"><Instagram/></a><a href="#contact"><Facebook/></a><a href="#contact"><Linkedin/></a></div></div><div className="footer-links"><h4>EXPLORE</h4><a href="#home">Home</a><a href="#about">About us</a><a href="#services">Our services</a><a href="#occasions">Occasions</a></div><div className="footer-links"><h4>PLATFORM</h4><a href="#services">Guest menus</a><a href="#services">Kitchen coordination</a><a href="#services">Supplier costing</a><a href="#services">Reports</a></div><div className="footer-news"><h4>STAY IN THE LOOP</h4><p>Updates and ideas for smoother food and event planning.</p><form onSubmit={e=>{e.preventDefault()}}><input type="email" required placeholder="Your email address"/><button aria-label="Subscribe"><ArrowRight/></button></form></div></div><div className="footer-bottom"><span>© 2026 MenuPilot. All rights reserved.</span><span>Plan better. Serve beautifully.</span><a href="#home">Back to top ↑</a></div></footer>
  {authMode && (
    <div
      className="auth-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setAuthMode(null);
      }}
    >
      <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" onClick={() => setAuthMode(null)} aria-label="Close form">
          <X size={19} />
        </button>
        <span className="auth-icon"><Utensils size={21} /></span>
        <div className="eyebrow"><i />{authMode === "signin" ? "WELCOME BACK" : "GET STARTED"}</div>
        <h2 id="auth-title">
          {authMode === "signin" ? "Sign in to MenuPilot" : "Create your account"}
        </h2>
        <p className="auth-intro">
          {authMode === "signin"
            ? "Enter your details to continue."
            : "Join MenuPilot to organise food and events with ease."}
        </p>
        <form
          className="auth-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setAuthLoading(true);
            setAuthMessage("");
            const form = new FormData(event.currentTarget);
            const payload = {
              email: String(form.get("email")),
              password: String(form.get("password")),
              ...(authMode === "signup" ? { name: String(form.get("name")) } : {}),
            };
            const expectedStatus = authMode === "signup" ? 201 : 200;

            try {
              const response = await fetch(`${API_BASE_URL}/auth/${authMode}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const result: {
                user?: { id?: string; email?: string };
                error?: string;
              } = await response.json();

              if (
                response.status !== expectedStatus ||
                !result.user?.id ||
                !result.user.email
              ) {
                throw new Error(result.error || "Authentication failed.");
              }

              router.push("/dashboard");
              router.refresh();
            } catch (error) {
              setAuthMessage(
                error instanceof Error ? error.message : "Unable to connect. Please try again.",
              );
            } finally {
              setAuthLoading(false);
            }
          }}
        >
          {authMode === "signup" && (
            <label>
              Full name
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Your name"
                required
                maxLength={100}
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={authMode === "signin" ? "current-password" : "new-password"}
              placeholder="Enter your password"
              minLength={authMode === "signup" ? 8 : undefined}
              maxLength={72}
              required
            />
          </label>
          <button className="btn primary" type="submit" disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : authMode === "signin"
                ? "Sign In"
                : "Create Account"}
            <ArrowRight size={17} />
          </button>
          {authMessage && <p className="auth-feedback" role="status">{authMessage}</p>}
        </form>
        <p className="auth-switch">
          {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => openAuth(authMode === "signin" ? "signup" : "signin")}>
            {authMode === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
        <small className="auth-form-note">Your account is protected with a secure session.</small>
      </section>
    </div>
  )}
 </main>
}