export const defaultProjectGroups = [
  {
    title: 'Company Projects',
    kind: 'Company',
    items: [
      {
        title: 'Lexstar.com - Doctor Appointment Booking Platform',
        desc: 'Contributed to a healthcare platform where users can find trusted doctors and dentists, book appointments, and manage their care journey in one place.',
        caseStudy: [
          'Built patient-facing booking flows for in-person and Telehealth consultations.',
          'Implemented doctor search and specialty discovery for faster appointment matching.',
          'Worked on HIPAA-focused privacy and secure patient data handling experiences.',
          'Supported trusted provider network UX and onboarding journeys.'
        ],
        stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB'],
        link: 'https://lexstar.com/'
      },
      {
        title: 'Invoice Management System',
        desc: 'Developed a full-stack invoice processing system with responsive frontend and API-driven backend for billing workflows.',
        caseStudy: [
          'Built frontend using React and Tailwind CSS for responsive invoice workflows.',
          'Implemented backend using Node.js, Express.js, and MongoDB.',
          'Added pending invoice tracking and easy-to-use financial record management.'
        ],
        stack: ['React.js', 'Tailwind CSS', 'Node.js', 'Express.js', 'MongoDB'],
        link: '#'
      }
    ]
  },
  {
    title: 'Self Projects',
    kind: 'Self',
    items: [
      {
        title: 'Online Doctor Appointment System',
        desc: 'Created a platform where patients can book, reschedule, and cancel appointments with registered doctors.',
        caseStudy: [
          'Implemented three dedicated panels: Patient, Doctor, and Admin.',
          'Handled appointment booking flow and doctor-side schedule management.',
          'Added admin controls for managing users and appointment data.'
        ],
        stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB'],
        link: '#'
      }
    ]
  }
]
