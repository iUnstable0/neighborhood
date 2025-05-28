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



export default function Info() {

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

      <h1 className="title">About Neighborhood</h1>
      <p>Neighborhood is a housing program in San Francisco that is organized by <a href="https://hackclub.com">Hack Club</a>, a 501(c)(3) nonprofit that supports a global community of over 50,000 high school makers.</p>

      <h1>What is Neighborhood?</h1>
      <p>Complete 100 hours of coding, and you'll be able to stay in San Francisco for up to three months, for free! From June to August, you'll be staying with 50* other hackers in various houses — living there, working together, and creating the amazing apps with new friends.</p>
      <p>Flights, food, and housing will be funded. This program is a grant-based initiative, eligible for all high schoolers <b>aged 18 and younger</b> from all over the world.</p>
      <p><i>*50 is just an estimated number. There is no capacity limit for Neighborhood!</i></p>

      <h1>What is Hack Club?</h1>
      <p>Hack Club is a 501(c)(3) nonprofit (EIN: 81-2908499) that helps high school students learn to code and build projects. We’re the largest teen-led coding community, with over 50,000 students building projects with their friends in Hack Club each year.</p>
      <p>Beyond online programs, we organize in-person hackathons and adventures. Some of our past events include:</p>
      <ul>
      <li><a href="https://trail.hackclub.com" target="_blank">Trail</a>: A seven-day hike on the Pacific Crest Trail where 30 teens from nine countries designed custom PCBs</li>
      <li><a href="https://www.youtube.com/watch?v=fuTlToZ1SX8" target="_blank">Juice</a>: A 2-month game jam followed by a seven-day pop-up game exhibition cafe in Shanghai, China</li>
      <li><a href="https://zephyr.hackclub.com" target="_blank">Zephyr</a>: The world’s longest hackathon, held on a cross-country train across the U.S</li>
      </ul>
      <p>... and many more!</p>



      <p>To learn more about Hack Club, visit the <a href="https://hackclub.com" target="_blank">main website</a>, <a href="https://hackclub.com/team/" target="_blank">Hack Club team</a>, and <a href="https://hackclub.com/philosophy/" target="_blank">Hack Club philosophy</a>.</p>

      <h1>Who can participate?</h1>
      <p>In order for you to be eligible for Neighborhood, the following criteria must be met:</p>
      <ul>
      <li>You must be 18 or younger for the entirety of the time you are participating in the event. If you turn 19 during Neighborhood, you are allowed to go, but must depart before you turn 19.</li>
      <li>You must have reached 100 hours of work on a singular project. This time is tracked with Hackatime and Stopwatch, features of the Neighborhood app. Stopwatch is intended for tasks that Hackatime cannot log (anything other than coding and Figma). Only 20 out of the 100 hours can be from Stopwatch, and there is no requirement that Stopwatch be used at all.)</li>
      <li>While staying in San Francisco, you must continue building open source projects or collaborating with peers for a minimum of 40 hours per week.</li>
      <li>You must make sure to ship your 100 hour project by the time of arrival in San Francisco and ship their projects each week while you are at Neighborhood. To ship is to deploy a publicly-accessible, working version of your project.</li>
      </ul>

      <h1>Organizers</h1>
      <p>Neighborhood is organized by various members of Hack Club Staff and its community. The lead organizer is Thomas Stubblefield, who has previously led other events such as Juice and Trail. More information about other organizers will be released soon.</p>

      </div>
    </SidebarLayout>

  );
}
