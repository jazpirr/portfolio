// ─────────────────────────────────────────────────────────────
//  Edit this file to update your portfolio. Everything on the
//  page (name, bio, skills, projects, links) comes from here.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Jazpher Neil P. Quirante',
  shortName: 'Jazpher Quirante',
  handle: 'JAZPHER',
  role: 'IT Student · Aspiring Software Engineer',
  school: 'Cebu Institute of Technology – University',
  location: 'Cebu, Philippines',
  status: 'Open to OJT / internship',
  // Typed out in the hero dialog box.
  greeting: "Hi! I'm Jazpher — an IT student and aspiring Software Engineer who enjoys turning ideas into functional, user-focused applications.",
  about: [
    "I'm a 4th-year BS Information Technology student at CIT-U, about to start my on-the-job training. From full-stack web platforms and Android apps to a two-player Java fighting game, I've explored different areas of software development and pushed myself to learn beyond the classroom.",
    'I like owning features end to end — designing the database, building and securing the API, then shipping the web or mobile client on top. I have led a small team, worked with Git on shared repos, and document what I build.',
  ],
  links: {
    email: 'jazpherquirante@gmail.com',
    linkedin: 'https://www.linkedin.com/in/jazpher-quirante/',
    github: 'https://github.com/jazpirr',
    resume: '', // put resume.pdf in /public and set this to '/resume.pdf'
  },
}

export const stats: [string, string][] = [
  ['Role', 'IT Student'],
  ['Year', '4th Year'],
  ['School', 'CIT-U'],
  ['Goal', 'OJT · 2026'],
]

export const skills: { group: string; items: string[] }[] = [
  { group: 'Languages', items: ['Java', 'Kotlin', 'JavaScript', 'Python', 'C / C++'] },
  { group: 'Web', items: ['HTML', 'CSS', 'React'] },
  { group: 'Backend', items: ['Spring Boot', 'Django', 'REST APIs', 'JWT / OAuth'] },
  { group: 'Databases', items: ['MySQL', 'PostgreSQL', 'Supabase', 'Firebase'] },
  { group: 'Tools', items: ['Git', 'GitHub', 'Android Studio', 'IntelliJ', 'VS Code', 'Postman', 'Figma', 'Jira', 'Docker'] },
  { group: 'Other', items: ['JavaFX', 'FXGL', 'AWS', 'Kali Linux'] },
]

export type Media = {
  src: string
  alt: string
  caption?: string
  animated?: boolean
  /** Tall phone screenshot: shown whole on a white backdrop instead of cropped. */
  portrait?: boolean
  /** Card-cover zoom, to crop empty margins baked into the image. */
  zoom?: number
}

export type Project = {
  title: string
  role: string
  tagline: string
  /** Short text shown on the card (kept to ~2 lines). */
  description: string
  /** Shown in the "Details" view. */
  highlights: string[]
  stack: string[]
  repo?: string
  live?: string
  /** Screenshots / animations. The first one is the card cover. */
  media?: Media[]
  context: string
  year: string
  /** Small badge on the card, e.g. "Web", "Game". */
  kind?: string
}

export const featured: Project[] = [
  {
    title: 'ClassCraft',
    kind: 'Web',
    role: 'Full-Stack Developer',
    tagline: 'Learn OOP and UML by building it',
    description: 'Interactive lessons and drag-and-drop exercises for learning OOP and UML.',
    highlights: [
      'Capstone project built with a team of 5',
      'Set up the React + Spring Boot project structure and built the Login & Register flow',
      'Built the “Learn the Basics” lessons: Relationships & Multiplicity and the 4 OOP Pillars',
      'Added learning measurability — tracking learner attempts and progress — and the dashboard',
      'Spring Boot REST API with JPA on PostgreSQL, using Supabase for authentication',
    ],
    stack: ['React', 'Spring Boot', 'Supabase', 'PostgreSQL', 'JPA'],
    repo: 'https://github.com/HarleyGoodz/ClassCraft',
    media: [
      { src: '/projects/classcraft-intro-anim.gif', alt: 'Animated ClassCraft landing page — “Don’t memorize OOP. Model it.” — beside the login form', caption: 'Landing & login', animated: true, zoom: 1.36 },
      { src: '/projects/classcraft-dashboard.webp', alt: 'Progress dashboard with first- and latest-attempt accuracy, scenarios meeting target, and a per-experience table with status badges', caption: 'Progress dashboard' },
      { src: '/projects/classcraft-formation.webp', alt: 'Class Diagram Formation exercise: drag pieces like “- health: int” into the class name, attributes and methods compartments', caption: 'Skill development · drag & drop' },
      { src: '/projects/classcraft-construction.webp', alt: 'Class Diagram Construction scenario: Online Shopping with Customer, Order and OrderItem, an empty canvas and a pieces palette', caption: 'Class diagram construction' },
      { src: '/projects/classcraft-basics.webp', alt: 'Learn the Basics lesson “Classes and Objects” with code examples of a Student class and object', caption: 'Learn the basics' },
    ],
    context: 'Capstone · Team of 5',
    year: '2026',
  },
  {
    title: 'SticTactics',
    kind: 'Game',
    role: 'Game Developer',
    tagline: 'Two-player 2D fighting game',
    description: 'A two-player 2D fighting game in Java + FXGL with hand-drawn fighters.',
    highlights: [
      'Collaborated with four other developers',
      'Core gameplay: character selection, movement, combat mechanics, health and map selection',
      'Round-based matches with a countdown timer, round tracker and special-move cooldowns',
      'Contributed to UI development and refinement, including profiles and match history screens',
      'Applied object-oriented principles and design patterns',
    ],
    stack: ['Java', 'FXGL', 'OOP'],
    media: [
      { src: '/projects/stictactics-menu-anim.webp', alt: 'Animated SticTactics title screen with Start, Controls, Profile, Match History and Exit', caption: 'Main menu', animated: true },
      { src: '/projects/stictactics-fight-1.webp', alt: 'Two stick fighters facing off with health bars, round markers and a 92-second timer', caption: 'Match start' },
      { src: '/projects/stictactics-fight-2.webp', alt: 'A knight fighter landing a hit on a ninja fighter mid-match, timer at 75', caption: 'Combat & special move' },
    ],
    context: 'OOP2 · Team of 5',
    year: '2025',
  },
  {
    title: 'ShareHub',
    kind: 'Web',
    role: 'Lead Developer',
    tagline: 'Peer lending library for CIT-U students',
    description: 'A portal for CIT-U students to lend and borrow books and gear.',
    highlights: [
      'Led the 3-person development team',
      'Built back-end features in Python/Django with Supabase + PostgreSQL for auth and data',
      'Implemented the front end in HTML, CSS and JavaScript',
      'Browse & search items, borrow requests with owner approval, and borrow/return tracking',
      'Item listings with photos and condition, request notifications and in-app messaging',
      'Automated due-date monitoring with admin oversight of transactions',
    ],
    stack: ['Django', 'Python', 'Supabase', 'PostgreSQL', 'JavaScript'],
    repo: 'https://github.com/jazpirr/CSIT327-G2-ShareHub',
    media: [
      { src: '/projects/sharehub-login.webp', alt: 'ShareHub sign-in page for CIT-U students', caption: 'Sign in' },
      { src: '/projects/sharehub-browse.webp', alt: 'ShareHub Browse & Borrow page showing a grid of item cards with photos and Request to Borrow buttons', caption: 'Browse & borrow' },
      { src: '/projects/sharehub-dashboard.webp', alt: 'ShareHub home dashboard with borrowed, pending request and lent-out counters and quick actions', caption: 'Dashboard' },
      { src: '/projects/sharehub-my-items.webp', alt: 'My Items page with item cards showing Available and Pending status badges and pending request counts', caption: 'My items' },
      { src: '/projects/sharehub-item-details.webp', alt: 'Item details modal with photo, description, owner, category and condition', caption: 'Item details' },
    ],
    context: 'CSIT327 · Team of 3',
    year: '2025',
  },
  {
    title: 'Ulysses',
    kind: 'Mobile',
    role: 'Android Developer',
    tagline: 'A promise to your future self',
    description: 'An Android app that locks distracting apps — no backing out early.',
    highlights: [
      'Built with one other developer in Kotlin and the Android SDK',
      'Usage dashboard: screen time, unlocks, notifications and weekly prevention stats',
      'Lock presets (1 day to 1 month) or a custom end date and time',
      '“Final Commitment” lock engine that can’t be undone early',
      'Block screen with a countdown when you open a locked app',
      'Firebase integration for back-end services and data management',
    ],
    stack: ['Kotlin', 'Android SDK', 'Firebase'],
    repo: 'https://github.com/jazpirr/Ulysses',
    media: [
      { src: '/projects/ulysses-intro-anim.webp', alt: 'Animated Ulysses intro: The Ulysses Pact — A Promise to Your Future Self', caption: 'Intro', animated: true, portrait: true },
      { src: '/projects/ulysses-dashboard.webp', alt: 'Activity details dashboard with a screen-time chart, weekly open attempts and prevention stats, and per-app usage', caption: 'Activity dashboard', portrait: true },
      { src: '/projects/ulysses-lock-duration.webp', alt: 'Set Lock Duration screen with 1 day, 3 days, 1 week and 1 month presets, a calendar and a time picker', caption: 'Set lock duration', portrait: true },
      { src: '/projects/ulysses-commitment.webp', alt: 'Final Commitment dialog explaining that settings cannot be changed until the lock period ends', caption: 'Final commitment', portrait: true },
      { src: '/projects/ulysses-blocked.webp', alt: 'Block screen: you have chosen to limit your time on this app, with a countdown, Go Home and Emergency options', caption: 'App blocked', portrait: true },
    ],
    context: 'Team of 2',
    year: '2025',
  },
  {
    title: 'PassMate',
    kind: 'Web',
    role: 'Front-end Developer',
    tagline: 'Event ticketing made simple',
    description: 'An event ticketing platform (released as “Event CIT”) where organizers create and manage campus events and attendees buy and track their QR tickets.',
    highlights: [
      'Built with a team of 3 — 30 of the project’s 75 commits are mine',
      'Built the buy-ticket flow, including purchases by multiple users',
      'Built the My Tickets page, event deletion with refunds, and edit/delete with confirmation pop-ups',
      'Built the login/register flow, home page and profile page, plus an event sales breakdown',
      'Connected the React front end to the REST API backend',
    ],
    stack: ['React', 'React Router', 'JavaScript', 'Axios', 'REST API'],
    repo: 'https://github.com/HarleyGoodz/PassMate',
    media: [
      { src: '/projects/passmate-intro-anim.webp', alt: 'Animated Event CIT landing page — “Skip the line, scan your way in” — with a QR ticket card and the login form', caption: 'Landing & login', animated: true, zoom: 1.2 },
      { src: '/projects/passmate-home.webp', alt: 'Event CIT home: “Skip the Line. Join the Fun.”, event search, available / happening now / finished counters and the published events list', caption: 'Home & events' },
      { src: '/projects/passmate-signup.webp', alt: 'Event CIT sign-up page with full name, Gmail, role (student, teacher, employee) and password fields beside a three-step guide', caption: 'Create account' },
    ],
    context: 'Team of 3',
    year: '2025',
  },
]

export const others: Project[] = [
  {
    title: 'Auth Service',
    kind: 'Full-stack',
    role: '',
    tagline: '',
    description: 'User registration and login with a Spring Boot API plus React web and Kotlin Android clients, with protected routes.',
    highlights: [],
    stack: ['Spring Boot', 'React', 'Kotlin'],
    repo: 'https://github.com/jazpirr/IT342_G2_Quirante_Lab1',
    context: 'IT342 · Lab',
    year: '2026',
  },
  {
    title: 'Ticketing & Check-in API',
    kind: 'API',
    role: '',
    tagline: '',
    description: 'Layered Spring Boot REST API (controller → service → repository) with Spring Data JPA.',
    highlights: [],
    stack: ['Spring Boot', 'JPA'],
    repo: 'https://github.com/jazpirr/CSIT321_ACTIVITY10_PROJECT',
    context: 'CSIT321 · Team',
    year: '2025',
  },
  {
    title: 'Student Enrollment',
    kind: 'Desktop',
    role: '',
    tagline: '',
    description: 'JavaFX desktop app for managing students and courses with FXML views.',
    highlights: [],
    stack: ['Java', 'JavaFX'],
    repo: 'https://github.com/jazpirr/OOP_activities',
    context: 'OOP coursework',
    year: '2025',
  },
  {
    title: 'Web Calculator',
    kind: 'Web',
    role: '',
    tagline: '',
    description: 'Framework-free calculator to practise DOM events and layout.',
    highlights: [],
    stack: ['HTML', 'CSS', 'JS'],
    repo: 'https://github.com/jazpirr/Calculator-HTML-CSS-JS-',
    context: 'Practice',
    year: '2025',
  },
]

export const education = [
  { level: 'College', school: 'Cebu Institute of Technology – University', detail: 'BS Information Technology', years: '2022 – 2026' },
  { level: 'Senior High', school: 'Southwestern University PHINMA', detail: 'TVL – ICT', years: '2021 – 2022' },
  { level: 'Junior High', school: 'Matilda L. Bradford Christian School', detail: '', years: '2017 – 2021' },
  { level: 'Elementary', school: 'Lahug Christian School', detail: '', years: '2010 – 2017' },
]

export type Certification = {
  title: string
  detail: string
  issuer: string
  date?: string
  /** Certificate image in /public/certs (shown as a card + full-size viewer). */
  image?: string
  /** Public verification link (Credly, CodeChum). */
  url?: string
  /** e.g. "In progress" for a course that isn't finished yet. */
  status?: string
}

export const certifications: Certification[] = [
  {
    title: 'AWS Academy Cloud Foundations',
    detail: 'Graduate training badge · 20 hours',
    issuer: 'AWS Academy',
    date: 'Oct 2026',
    image: '/certs/aws-cloud-foundations.webp',
    url: 'https://www.credly.com/go/aLT6wizK',
  },
  {
    title: 'AWS Academy Generative AI Foundations',
    detail: 'Graduate training badge · 12 hours',
    issuer: 'AWS Academy',
    date: 'Oct 2026',
    image: '/certs/aws-genai-foundations.webp',
    url: 'https://www.credly.com/badges/231aedfb-906a-4e09-b02a-cb07a7dd53f3',
  },
  {
    title: 'Cybersecurity Fundamentals',
    detail: 'IBM SkillsBuild',
    issuer: 'IBM',
    date: 'Oct 2026',
    image: '/certs/ibm-cybersecurity.webp',
    url: 'https://www.credly.com/badges/bb7a064c-3f12-4d4e-a0dd-e28ffaea1f36',
  },
  {
    title: 'Java Object-Oriented Programming',
    detail: 'CIT-U certification exam',
    issuer: 'CodeChum',
    date: 'May 2025',
    image: '/certs/codechum-java-oop.webp',
    url: 'https://citu.codechum.com/certificates/10070',
  },
  {
    title: 'C Programming',
    detail: 'CIT-U certification',
    issuer: 'CodeChum',
    date: 'May 2024',
    image: '/certs/codechum-c.webp',
    url: 'https://citu.codechum.com/certificates/805',
  },
  { title: 'IBM Full Stack Software Developer', detail: 'Professional Certificate', issuer: 'IBM · Coursera', status: 'Currently taking' },
]
