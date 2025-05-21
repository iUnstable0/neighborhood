import Head from "next/head";
// import { Geist, Geist_Mono, Chewy } from "next/font/google";
import { M_PLUS_Rounded_1c } from "next/font/google";
import SidebarLayout from '@/components/info/SidebarLayout'
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });
// const chewy = Chewy({
//   weight: "400",
//   variable: "--font-chewy",
//   subsets: ["latin"],
// });
const mPlusRounded = M_PLUS_Rounded_1c({
  weight: "400",
  variable: "--font-m-plus-rounded",
  subsets: ["latin"],
});



export default function ForParents() {

  function Title({ children }) {
    return (
      <h1 style={{
        fontSize: 60

      }}>
        {children}
      </h1>
    )
  }

  function SectionTitle({ children }) {
    return (
      <h1 style={{
        marginTop: 20

      }}>
        {children}
      </h1>
    )
  }

  return (

    <SidebarLayout>
    <style jsx>{`
      p, li {
        margin: 8px 0;
        margin-bottom: 16px;
      }

      h1 {
        margin-top: 20px;
      }

      h1.title {
        font-size: 60px;
      }

      a {
        color: #915E3B;
        text-decoration: underline #915E3B;

      }

      a:hover {
        text-decoration: underline wavy #915E3B;
      }

      .main {
        padding: 35px;
        padding-right: 200px;
      }

      @media (max-width: 768px) {
        h1.title {
          font-size: 48px;
        }
        .main {
          padding-right: 35px;
        }
      }
    `}</style>

    <div className={`${mPlusRounded.variable} main`}>

      <h1 className="title">Parents' Guide & FAQ to Neighborhood</h1>
      <h1>What is Hack Club?</h1>

      <p>Hack Club is a 501(c)(3) nonprofit organization whose mission is to foster a wholesome generation of coders, makers, founders, and builders. Hack Club is a network of hundreds of student-led computer science clubs and a safe, positive online community of over 50,000 high school makers from around the world. Hack Club programs are free and accessible to all students. We support teenagers in making real projects in the real world. Hack Club is supported by notable figures in the tech industry, including GitHub founder Tom Preston-Werner, Dell Founder Michael Dell and executives at Apple, Facebook, Microsoft, and GitHub, as well as many up-and-coming tech startups.</p>
      <p>Beyond online programs, we organize in-person hackathons and adventures. Some of our past events include:</p>
      <ul>
      <li><a href="https://trail.hackclub.com" target="_blank">Trail</a>: A seven-day hike on the Pacific Crest Trail where 30 teens from nine countries designed custom PCBs</li>
      <li><a href="https://www.youtube.com/watch?v=fuTlToZ1SX8" target="_blank">Juice</a>: A 2-month game jam followed by a seven-day pop-up game exhibition cafe in Shanghai, China</li>
      <li><a href="https://zephyr.hackclub.com" target="_blank">Zephyr</a>: The world’s longest hackathon, held on a cross-country train across the U.S</li>
      </ul>
      <p>... and many more!</p>
      <p>To learn more about Hack Club, visit the <a href="https://hackclub.com" target="_blank">main website</a>, <a href="https://hackclub.com/team/" target="_blank">Hack Club team</a>, and <a href="https://hackclub.com/philosophy/" target="_blank">Hack Club philosophy</a>.</p>


      <h1>What is Neighborhood?</h1>
      <p>Neighborhood is a 3-month housing program organized by Hack Clubbers, for Hack Clubbers. Participants will be invited to stay in San Francisco Neighborhood as long as they work on creating an awesome app for at least 40 hours a week, for a minimum of 2 weeks, up to 3 months.</p>
      <p>Flights, food, and housing will be funded. This program is a grant-based initiative, eligible for all high schoolers <b>aged 18 and younger</b> from all over the world.</p>

      <h1>Who can participate?</h1>
      <p>In order for your child to be eligible for Neighborhood, the following criteria must be met:</p>
      <ul>
      <li>Your child must be 18 or younger for the entirety of the time they are participating in the event. If your child turns 19 during Neighborhood, they are allowed to go, but must depart before they turn 19.</li>
      <li>Your child must have reached 100 hours of work on a singular project. This time is tracked with Hackatime and Stopwatch, features of the Neighborhood app. Stopwatch is intended for tasks that Hackatime cannot log (anything other than coding and Figma). Only 20 out of the 100 hours can be from Stopwatch, and there is no requirement that Stopwatch be used at all.)</li>
      <li>While staying in San Francisco your child must continue building open source projects or collaborating with peers for a minimum of 40 hours per week.</li>
      <li>The participant must make sure to ship their 100 hour project by the time of arrival in San Francisco and ship their projects each week while they are at Neighborhood. To ship is to deploy a publicly-accessible, working version of their project.</li>
      </ul>


      <h1>What are the costs associated?</h1>
      <p>Participation is <b>entirely free</b>, but there are requirements for entry that your child must meet. Without completing 100 hours of coding, your child won't be able to join Neighborhood.</p>
      <p>We will cover housing and food for the entire duration of their stay. Public transportation in San Francisco is also free for everyone under 18.</p>
      <p>We also offer travel stipends for anyone who completes 100 hours.</p>

      <h1>Traveling to Neighborhood</h1>
      <p>The travel stipend is <b>$500 for US/Canada</b> and <b>$750 for other countries</b>. It's meant to cover at least 50% of the round-trip airfare cost. Your child must complete the requirements above to be eligible for the stipend. It covers the lowest-cost and most reasonable flight from your country.</p>
      <p>Hack Club <b>will not cover visas or passports fees</b>. However, if there is leftover money from the stipend after the plane tickets have been booked, you may use that for visa or passport fees.</p>
      <p>The program, travel stipends, and housing are only for your child — they do not cover costs for parents. Parents and guardians can come with their child if they wish, but they must cover all costs themselves and find separate housing.</p>

      <p>For transport within San Francisco, there is Muni: San Francisco's network of buses and metro trains. Muni is free for everyone under 18, making it perfect for your child to use when  traveling around SF. Your child will likely use Muni to travel from the Airport to their housing for Neighborhood.</p>

      <h1>Visa Information</h1>
      <p>If your child is traveling internationally to attend Neighborhood, they will need either an ESTA or a visa based on their country of citizenship. <b>Meeting the requirements to enter the United States is the responsibility of the attendee</b>, and you are encouraged to do your own research.</p>
      <p>If you need to apply for a visa and need a Letter of Invitation, please fill in <a href="https://forms.hackclub.com/t/xyQAKPh9Zmus" target="_blank">this form</a>. Participants are only eligible for a letter <b>after they have logged over 50 hours</b> on the Neighborhood app.</p>

      <h1>Safety and Concerns</h1>
      <p>We understand that sending your child to Neighborhood for the summer might raise some important safety concerns and anxieties. Hack Club is committed to creating a safe and comfortable environment for event participants. As with previous Hack Club events, all adults present have undergone rigorous background checks (both at the state and Federal level). We aim for a gender-balanced community and offer a safe space for all teenagers. During the event, <b>a toll-free staff helpline (+1 855-625-HACK)</b> will be available 24/7 if you have any questions.</p>

      <p>Your child will have their devices (e.g., phone, laptop) during this event so that you can contact them directly through those. If you're based internationally, consider buying a prepaid (e)SIM card for international calling. So your child can connect to the internet when WiFi is unavailable. If, for any reason, you cannot contact your child directly via call or text, you'll be able to call a member of the Hack Club staff for help communicating with your child.</p>

      <h1>Accommodations</h1>
      <p>More details about the housing and locations will be shared as soon as we have complete information. Participants will be staying in houses together and room with other Hack Clubbers. The selected houses are all in safe, vetted areas.</p>


      <h1>More information...</h1>
      <p>More information can be found in the FAQ page. If you have further queries, you can also contact thomas@hackclub.com for inquiries.</p>

      </div>
    </SidebarLayout>

  );
}
