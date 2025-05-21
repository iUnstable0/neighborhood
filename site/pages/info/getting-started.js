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



export default function GettingStarted() {

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

      <h1 className="title">Getting Started</h1>

      <ol>
      <li>Join our Slack (by signing up in the <a href="https://neighborhood.hackclub.com" target="_blank">main page</a>) and follow the process in <a href="https://hackclub.slack.com/archives/C039PAG1AV7" target="_blank">#slack-welcome-start</a>.</li>
      <li>Login on <a href="https://hackatime.hackclub.com" target="_blank">Hackatime</a> using Slack. Follow the tutorial to set up and start logging hours in the code editor that you use.</li>
      <li>Once you get Hackatime set up, head to <a href="https://neighborhood.hackclub.com/download" target="_blank">Neighborhood App Download</a> or <a href="https://neighborhood.hackclub.com/desktop" target="_blank">Neighborhood App Online</a> and connect your project. Remember to use the same email as Slack!</li>
      <li>Read <a href="https://www.notion.so/What-should-you-build-for-Neighborhood-in-100-hours-1e76b7a487ba80af946ef9c938222d3f" target="_blank">this letter by Thomas</a> to get an idea of the kind of projects that you should make. Make something playful, something you love!</li>
      <li>Push your commits frequently. Create a devlog every couple of hours (recommended 3-4h) with a screen recording that shows what you’ve achieved. Include a little video explanation too, and say hi to everyone!</li>
      <li>When you hit 50 hours, <a href="https://forms.hackclub.com/t/xyQAKPh9Zmus" target="_blank">request a visa invitation letter</a>!</li>
      <li>When you hit 100 hours, you’ll get the stipend for your flight! You can start thinking about your fly-in and fly-out dates — IRL Neighborhood runs from the whole of June to August. (Minimum stay length: 2 weeks, maximum stay length: 3 months. Flight, food, and housing all covered!)</li>
      <li><b>There is no capacity limit. Everyone who hits 100 hours will come.</b></li>
      </ol>
      <p>Have more questions? Head to the FAQ!</p>



      </div>
    </SidebarLayout>

  );
}
