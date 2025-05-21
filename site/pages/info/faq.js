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



export default function FAQ() {

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

      <h1 className="title">Frequently Asked Questions</h1>
      <p>This FAQ is sorted by sections. Jump to the different sections quickly here:</p>

      <h1>What projects qualify?</h1>
      <p>There is no capacity limit for Neighborhood. If you spend 100 hours, you can come!</p>

      <p><b>Must I work on the same project for 100 hours? Can I make a few different projects?</b> You must work on only ONE project during the 100 hours before you come — but you do not need to continue that same project when you move to San Francisco (although you are welcome to).</p>

      <p><b>Can I work in a team?</b> You’re welcome to work in team! Each individual person must hit 100 hours for them to go to SF. You can go to SF if you hit 100 hours, but the rest of your team doesn’t.</p>

      <p><b>Can we make private repos?</b> No, all projects must be open source.</p>

      <p><b>Can we charge money for our project? Can we sell it?</b> Your project must be free for Hack Clubbers to access through the duration of Neighborhood, and must also be open source. Beyond that, you’re free to sell it or charge money for it!</p>

      <p><b>Can we continue to work on an existing project as long as we spend an additional 100 hours on it?</b> No, it must be a new project.</p>

      <p><b>Can I work on a project for Neighborhood and Shipwrecked (or other events) at the same time?</b> No, they must be for Neighborhood specifically. You cannot double-count your hours. However, you’re welcome to do both events if you do do the sum of the hours in total (eg. Neighborhood + Shipwrecked for 160h).</p>

      <p><b>Can one project be spread across multiple GitHub repos, if it logically makes sense to do so?</b> Yep!</p>

      <p><b>If we had a passion project assignment for computer science class, could we work on that as our app?</b>Yes, as long as you're genuinely passionate about your project!</p>

      <p><b>Does it count if it's a tool for the rest of the developers and not an app? What about a CLI tool/TUI?</b> Yes, as long as it's usable outside of the code-editor as well!</p>


      <h1>Working on your projects & devlogs</h1>

      <p><b>What if I’m working on my project but it’s not tracked by Hackatime — eg. drawing, making music?</b> There's Hackatime and Stopwatch. Stopwatch is only for limited use (20hr cap out of the 100hours). Stopwatch will be used for cases where Hackatime isn't suitable like some design work for the project in a tool like Figma. Only time spent actively coding or doing design work will count toward your total time; time spent researching (e.g. watching videos, reading) does not count toward your total time.</p>

      <p><b>Do we have to finish the 100-hour project before we fly to SF, if we want to keep working on it?</b> You do not have to completely finish your project, but there must be a publicly available and usable version — for example, a website that is accessible for everyone to use.</p>

      <p><b>Are devlogs necessary? How frequent/how long should they be?</b> Devlogs are compulsory! We recommend recording one every 3-4 hours of working on your project, but you can adjust as you see fit depending on your progress. In the devlog, tell us about what you’ve worked on — we need this so that we can verify the amount of time you spent :) It would be wonderful if you could show yourself and say hi in the devlog, too! If you’re uncomfortable, feel free to use something like a vtuber model if you wish.</p>

      <h1>Hours and stipends</h1>

      <p><b>Is the 40 hours per week requirement strict? Is it alright if we miss the hour mark if we have other remote activities/studies to do while in the program?</b> Yes, it’s a strict requirement but you can do weekends too. It’s also not set timing, like 9am-5pm daily. You just need to code on your personal projects for at least 40 hours each week.</p>

      <p><b>Can I do less hours if I don’t need a flight stipend?</b> No, it’s 100 hours in order to come regardless of if flight stipend is needed.</p>

      <p><b>Do the 100 hours have to be done by the end of may, or could it be completed before we leave?</b> 100 hours are before you arrive in San Francisco, so for folks starting in early June, they'd need to have 100 hours in by end of May. If you are arriving later, finish 100 hours by the time that you plan to move in.</p>



      <h1>Flights, cost, and length of stay</h1>

      <p><b>Will the full flight cost be covered?</b> The travel stipend is $500 for US/Canada students and $750 for international students. It's meant to cover at least 50% of the round-trip airfare cost. You need to complete 100 hours of work on your project and ship it to be eligible. It covers up to the lowest cost reasonable flight from your country.</p>

      <p><b>What is the dollar value for the stipend for living expenses, and will insurance/transport be covered?</b> Coming to Neighborhood includes housing with Hack Clubber housemates, food (groceries - you need to cook), in-city transit, and a flight stipend. (Transit is free for age 18 and under in SF (bus and trains).)</p>

      <p><b>Could I come and go twice over the summer?</b>Travel stipend is only for 1 round-trip SF. You can come and leave at your own cost, but you will need to maintain 40 hrs/week coding.</p>

      <h1>In-person stay</h1>

      <p><b>Will there be anyone from HQ staying with us?</b> No - they'll have their own separate housing.</p>

      <p><b>Do we cook our own food?</b> Yes, you have weekly groceries - anything beyond that is paid for by you!</p>

      <p><b>Can I pick my roommates?</b> Yes but they will have to be of the same gender.</p>

      <p><b>Will there be a curfew?</b> No, this is an unsupervised program — you decide what you do every day :)</p>

      <h1>Visa, passport, and getting there</h1>

      <p><b>Do I need a visa? How do I get one?</b> You are in charge of getting your own visa. Research on your own whether a visa is required for your passport — you might need an ESTA instead! <b>Once you complete 50 hours of coding/project work, you will be eligible to receive an official invitation letter</b> that can support your visa application. Reaching this milestone significantly increases your chances of visa approval and helps expedite the application process.</p>

      <p><b>What kind of visa do we get?</b> Unfortunately this program is not suitable for educations visa's such as J1 etc. You need to get a B1/B2 Visa.</p>

      <p><b>Will we be reimbursed for the visa?</b> If the visa cost falls within the participant’s allocated stipend amount, the program may be able to reimburse it. However, obtaining the visa remains the participant’s own responsibility.</p>

      <h1>More questions?</h1>
      <p>If you have any questions, join the <a href="https://hackclub.slack.com/archives/C073L9LB4K1" target="_blank">#neighborhood</a> channel on Hack Club Slack!</p>



      </div>
    </SidebarLayout>

  );
}
