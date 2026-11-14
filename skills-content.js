'use strict';

// Original practice material. Short sets are drills, not complete IELTS papers.
window.IELTS_CONTENT = {
  reading: [
    {
      id: 'reading-cool-streets',
      title: 'Why streets stay warm after sunset',
      description: 'An original academic mini-passage about urban heat. Eight questions: identifying information, multiple choice and sentence completion.',
      timeMinutes: 12,
      passage: `A city does not begin cooling the moment the sun disappears. Brick, concrete and asphalt absorb energy during the day and release it slowly at night. This ability to store energy, known as thermal mass, explains why a paved square can remain uncomfortable long after a nearby grassy field has cooled. Narrow streets can also restrict airflow, although their buildings may provide useful shade earlier in the day.

At the fictional Westbridge campus, a research team compared three walking routes over three summers. One route had mature trees, another had newly planted saplings, and the third had no trees. Temperature sensors were placed 1.5 metres above the ground, roughly the height at which a pedestrian experiences the street. The team recorded traffic levels and pavement materials as well, so that differences in these factors would not be confused with the effect of vegetation.

The mature trees provided the greatest afternoon benefit. Their continuous canopy prevented much of the incoming sunlight from reaching the pavement. Saplings offered smaller patches of shade, but their effect increased as they grew. Neither planting strategy produced the same reduction everywhere: watering, soil volume and the distance between trees all mattered. The researchers therefore warned against judging a scheme simply by counting the number of trees planted.

Results after sunset were less straightforward. On still evenings, dense foliage sometimes slowed the escape of heat from the street below. A route that was cooler at four in the afternoon was not necessarily the coolest at midnight. The team recommended keeping gaps for ventilation and measuring conditions at several times of day.

The findings do not make street trees undesirable. They show that a successful cooling strategy must respond to local conditions and to when people use a space. A bus stop needs reliable daytime shade; a residential courtyard may also need a clear path for night-time breezes.`,
      questions: [
        { id: 'cool-1', prompt: 'Brick and asphalt can release stored heat after the sun has set.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['TRUE'], explanation: 'The opening paragraph says these materials absorb energy in daytime and release it slowly at night.' },
        { id: 'cool-2', prompt: 'The researchers found that every tree-planting strategy reduced temperatures by the same amount.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['FALSE'], explanation: 'The passage explicitly says the reduction varied with watering, soil volume and tree spacing.' },
        { id: 'cool-3', prompt: 'The campus spent less on mature trees than on saplings.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['NOT GIVEN'], explanation: 'The passage compares cooling effects, but gives no purchase or maintenance costs for either kind of tree.' },
        { id: 'cool-4', prompt: 'Why did the team record traffic levels and pavement materials?', type: 'select', options: ['To distinguish other influences from the effect of vegetation', 'To decide where to build a new road', 'To estimate the cost of maintaining the campus'], answers: ['To distinguish other influences from the effect of vegetation'], explanation: 'Recording these factors helped the researchers avoid attributing their effects to vegetation.' },
        { id: 'cool-5', prompt: 'Complete with TWO WORDS from the passage: The ability of a material to store energy is called ________.', type: 'text', answers: ['thermal mass'], explanation: 'The first paragraph names the energy-storage property “thermal mass”. Both words are required.' },
        { id: 'cool-6', prompt: 'Complete with NO MORE THAN TWO WORDS from the passage: The research continued over ________.', type: 'text', answers: ['three summers', '3 summers'], explanation: 'The team compared the three routes over three summers. This is the study period, not the number of routes.' },
        { id: 'cool-7', prompt: 'What occasionally happened beneath dense foliage on still evenings?', type: 'select', options: ['Heat escaped more slowly', 'Traffic levels increased', 'All stored heat disappeared immediately'], answers: ['Heat escaped more slowly'], explanation: 'Dense foliage sometimes slowed heat escaping from the street when the air was still.' },
        { id: 'cool-8', prompt: 'Which recommendation best expresses the passage’s main argument?', type: 'select', options: ['Design cooling measures around local conditions and patterns of use', 'Replace every paved surface with grass', 'Judge tree schemes only by the number of trees planted'], answers: ['Design cooling measures around local conditions and patterns of use'], explanation: 'The conclusion links effective design to local conditions and the times when people use each space.' }
      ]
    },
    {
      id: 'reading-library',
      title: 'The changing purpose of a public library',
      description: 'An original academic mini-passage about access, evidence and public services. Eight questions with explanations.',
      timeMinutes: 12,
      passage: `When the fictional town of Mereford reviewed its library service, falling book loans appeared to tell a simple story. Borrowing had dropped by a quarter in five years, and several councillors argued that online information had made the building unnecessary. The library manager suggested a different explanation: the loan count described only one part of what residents did there.

For six weeks, staff asked visitors to record their main reason for coming. Some borrowed novels, but others used computers to complete job applications or attended language classes. Parents valued a quiet place where children could read after school. Older residents described the weekly conversation group as an important opportunity to meet people. None of these activities, except borrowing, appeared in the council’s existing performance measure.

The survey did not settle every question. It covered spring rather than a full year, and visitors who were uncomfortable filling in forms may have been under-represented. Nevertheless, it provided enough evidence to test a new arrangement. The council retained the central building and converted a seldom-used storage room into a flexible learning space. Books remained on open shelves, while movable tables allowed workshops to take place without permanently dividing the room.

Opening hours also changed. Instead of closing at five on every weekday, the library opened until eight on Tuesdays and Thursdays. Total staffing hours stayed the same because two quiet mornings were shortened. After four months, evening attendance exceeded expectations, although the number of books borrowed had not returned to its earlier level.

The council now reviews loans alongside room bookings, computer use and attendance at events. Its report cautions that a large number of visits is not proof of educational success: a visitor might use a computer without acquiring a new skill. The purpose of the wider measures is to make previously invisible services visible, not to replace one simplistic target with another.`,
      questions: [
        { id: 'library-1', prompt: 'Book borrowing in Mereford had fallen by 25% over five years.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['TRUE'], explanation: 'A drop “by a quarter” means a reduction of 25%; the first paragraph states a five-year period.' },
        { id: 'library-2', prompt: 'Every visitor who took part in the survey came to borrow a book.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['FALSE'], explanation: 'Visitors also came for computers, language classes, children’s reading and a conversation group.' },
        { id: 'library-3', prompt: 'The town’s library was larger than libraries in neighbouring towns.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['NOT GIVEN'], explanation: 'No comparison with the size of neighbouring libraries is provided.' },
        { id: 'library-4', prompt: 'What was a limitation of the visitor survey?', type: 'select', options: ['It represented only part of the year', 'It recorded only book loans', 'It excluded every older resident'], answers: ['It represented only part of the year'], explanation: 'The survey lasted six weeks in spring, so it did not capture a complete annual pattern.' },
        { id: 'library-5', prompt: 'Complete with NO MORE THAN TWO WORDS from the passage: A former ________ became a flexible learning space.', type: 'text', answers: ['storage room'], explanation: 'The council converted a seldom-used storage room; the central building itself was retained.' },
        { id: 'library-6', prompt: 'Complete with ONE WORD from the passage: The furniture could be rearranged because the tables were ________.', type: 'text', answers: ['movable'], explanation: 'Movable tables let staff hold workshops without permanently dividing the room.' },
        { id: 'library-7', prompt: 'How did the library fund its later closing times in staff hours?', type: 'select', options: ['It shortened two quiet mornings', 'It doubled its weekly staffing hours', 'It closed every weekday morning'], answers: ['It shortened two quiet mornings'], explanation: 'Total staffing hours remained unchanged because two quieter morning sessions were shortened.' },
        { id: 'library-8', prompt: 'Why does the report caution against treating visits as proof of educational success?', type: 'select', options: ['Attendance does not necessarily show that a skill was learned', 'Computer use can never be useful', 'The library recorded attendance incorrectly'], answers: ['Attendance does not necessarily show that a skill was learned'], explanation: 'The final paragraph distinguishes using a service from demonstrating a learning outcome.' }
      ]
    },
    {
      id: 'reading-tidal',
      title: 'Predictable power, difficult decisions',
      description: 'An original academic mini-passage about tidal energy and how pilot studies inform decisions.',
      timeMinutes: 12,
      passage: `Tidal energy has an attractive advantage over some other renewable sources: the movement of the tides can be predicted far in advance. However, predictable movement does not mean that a device produces electricity continuously. Near the turn of the tide, water may move too slowly to generate useful power. A project therefore needs to be evaluated as one component of an electricity system, rather than as a complete replacement for every other source.

A fictional coastal authority considered installing underwater turbines in the Grey Sound channel. Engineers preferred this location because a large volume of water passed through a narrow opening. The same feature made the channel important to fishing boats, which used it to reach sheltered harbours. The proposed turbine positions were consequently moved away from the main navigation route before any equipment entered the water.

The authority approved a two-year pilot with one turbine. Researchers monitored electricity output, underwater noise and the movement of marine animals. They also held monthly meetings with fishers, whose observations helped identify changes that fixed sensors might miss. These reports were treated as additional evidence, not as a substitute for systematic measurement.

Maintenance proved more demanding than expected. Although the turbine was protected from surface storms, strong currents restricted the times when technicians could safely reach it. A design that allowed the generator to be lifted above the water reduced the length of later repairs. It did not eliminate the need to plan work around the tides.

At the end of the pilot, the authority published the results before deciding whether to expand the project. Electricity generation had broadly matched predictions, but uncertainty remained about the cumulative effects of several turbines operating together. The report recommended a gradual expansion with continued monitoring. Its central message was that technical promise and careful environmental investigation need to advance together.`,
      questions: [
        { id: 'tidal-1', prompt: 'Predicting the tides means a tidal turbine can generate electricity without interruption.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['FALSE'], explanation: 'The first paragraph says water can move too slowly near the turn of the tide, interrupting useful generation.' },
        { id: 'tidal-2', prompt: 'The proposed turbine positions were changed before installation.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['TRUE'], explanation: 'The positions were moved away from the main navigation route before equipment entered the water.' },
        { id: 'tidal-3', prompt: 'The pilot generated electricity more cheaply than a nearby wind farm.', type: 'select', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answers: ['NOT GIVEN'], explanation: 'There are no electricity-cost figures or comparisons with a wind farm.' },
        { id: 'tidal-4', prompt: 'Why did engineers initially favour the Grey Sound channel?', type: 'select', options: ['A large volume of water flowed through a narrow opening', 'There were no boats in the area', 'Maintenance could take place at any time'], answers: ['A large volume of water flowed through a narrow opening'], explanation: 'The concentrated water movement made the channel attractive to engineers; boats and restricted maintenance times were complications.' },
        { id: 'tidal-5', prompt: 'Complete with TWO WORDS from the passage: Researchers measured electricity output, animal movement and ________.', type: 'text', answers: ['underwater noise'], explanation: 'The pilot monitored electricity output, underwater noise and the movement of marine animals.' },
        { id: 'tidal-6', prompt: 'Complete with ONE WORD from the passage: Strong ________ limited safe access for maintenance.', type: 'text', answers: ['currents'], explanation: 'The fourth paragraph identifies strong currents, rather than surface storms, as the constraint on safe access.' },
        { id: 'tidal-7', prompt: 'What role did fishers’ observations play?', type: 'select', options: ['They supplemented systematic measurements', 'They replaced all sensor readings', 'They determined electricity prices'], answers: ['They supplemented systematic measurements'], explanation: 'Monthly reports supplied additional evidence, while systematic monitoring continued.' },
        { id: 'tidal-8', prompt: 'What did the final report recommend?', type: 'select', options: ['Expand gradually and continue monitoring', 'Install all planned turbines immediately without further study', 'Stop investigating tidal energy entirely'], answers: ['Expand gradually and continue monitoring'], explanation: 'The report supported gradual expansion because the cumulative effects of multiple turbines remained uncertain.' }
      ]
    }
  ],
  listening: [
    {
      id: 'listening-course',
      title: 'Booking a community photography course',
      description: 'An original enrolment conversation read aloud by your browser. Six detail questions. Read the questions before playing.',
      timeMinutes: 8,
      script: `Receptionist: Good morning, Riverside Learning Centre. How can I help?
Caller: I would like to join the beginner photography course. I saw an advertisement saying it starts on Monday the sixth.
Receptionist: That advertisement is out of date, I am afraid. The tutor is away that week. The course now starts on Monday the thirteenth of May, and it runs for six weeks.
Caller: Is it still an evening class?
Receptionist: Yes. It starts at six thirty and finishes at eight. You should arrive ten minutes early for the first session, but you do not need to come early every week.
Caller: And how much does it cost?
Receptionist: The standard fee is ninety pounds. Students pay seventy-five pounds if they show a valid student card. That includes the printed notes, but not any photographs you decide to print yourself.
Caller: I am not a student, so I will pay the standard amount. Do I need to buy a special camera?
Receptionist: No. A phone camera is fine for the first three sessions. After that, you can borrow a digital camera here without an extra charge. Please bring a notebook from the first evening.
Caller: Which room should I go to?
Receptionist: Room twelve, on the first floor. The lift is beside reception. At the last session, the group will meet in the garden instead, if the weather is dry.
Caller: Thank you. I will book a place now.`,
      questions: [
        { id: 'course-1', prompt: 'What is the revised start date? Write the day number and month.', type: 'text', answers: ['13 May', '13th May', 'May 13', 'May 13th', 'thirteenth of May', 'the thirteenth of May'], explanation: 'The receptionist corrects the old date, the sixth, to the thirteenth of May.' },
        { id: 'course-2', prompt: 'How many weeks does the course last? Write ONE NUMBER.', type: 'text', answers: ['6', 'six'], explanation: 'The receptionist says that the course runs for six weeks.' },
        { id: 'course-3', prompt: 'At what time does each class start?', type: 'select', options: ['6:20 p.m.', '6:30 p.m.', '8:00 p.m.'], answers: ['6:30 p.m.'], explanation: 'Classes start at 6:30. Arriving ten minutes early is requested only for the first session.' },
        { id: 'course-4', prompt: 'How much will this caller pay? Write the amount in pounds.', type: 'text', answers: ['90', '£90', '90 pounds', 'ninety', 'ninety pounds'], explanation: 'The caller is not a student, so the £90 standard fee applies; £75 is the student price.' },
        { id: 'course-5', prompt: 'What should the caller bring from the first evening?', type: 'select', options: ['A notebook', 'A borrowed digital camera', 'Printed course notes'], answers: ['A notebook'], explanation: 'The receptionist specifically asks for a notebook. Notes are included, and a phone camera is sufficient initially.' },
        { id: 'course-6', prompt: 'Which room is used for the first session? Write ONE NUMBER.', type: 'text', answers: ['12', 'twelve'], explanation: 'The regular classroom is Room 12. The garden is a possible location for the final session only.' }
      ]
    },
    {
      id: 'listening-transport',
      title: 'Changes to a workplace travel plan',
      description: 'An original workplace briefing. Six questions test numbers, changed plans and the speaker’s reasons.',
      timeMinutes: 8,
      script: `Good afternoon, everyone. I am going to explain the travel arrangements for our new office. We move on the first of September, but the travel trial begins two weeks earlier, on the eighteenth of August. That gives us time to solve any problems before the move.

First, the shuttle bus. We originally planned to collect staff from Central Station, but roadworks outside its main entrance would make that unreliable. The shuttle will instead leave from the library car park, which is a five-minute walk from the station. Please use the north entrance to the car park; the south entrance is for delivery vehicles.

The first shuttle leaves at seven forty-five. A second departure at eight fifteen should suit people who start work later. In the afternoon, both return services leave from the office reception area. The journey usually takes twenty minutes, though we have allowed thirty minutes on the timetable in case traffic is heavy.

There will also be secure bicycle storage for forty bicycles. We considered a smaller shelter beside the main gate, but chose the covered area behind the building because it is protected from rain. Showers are on the ground floor, next to the staff kitchen.

During the trial, shuttle travel is free. After the trial, a weekly pass will cost twelve pounds. Before Friday, please complete the online survey, even if you do not plan to use the shuttle. We need to understand everyone’s travel needs, not just those of bus passengers. Your answers will help us decide whether a third morning service is necessary.`,
      questions: [
        { id: 'travel-1', prompt: 'When does the travel trial begin?', type: 'select', options: ['18 August', '1 September', '18 September'], answers: ['18 August'], explanation: 'The trial begins on 18 August; 1 September is the office moving date.' },
        { id: 'travel-2', prompt: 'Where will the shuttle collect staff? Write NO MORE THAN THREE WORDS.', type: 'text', answers: ['library car park'], explanation: 'Roadworks caused the collection point to change from Central Station to the library car park. “Library car park” fits the three-word limit.' },
        { id: 'travel-3', prompt: 'Which car-park entrance should staff use?', type: 'select', options: ['North', 'South', 'Either entrance'], answers: ['North'], explanation: 'The speaker directs staff to the north entrance; the south entrance is reserved for deliveries.' },
        { id: 'travel-4', prompt: 'How long does the journey usually take? Write the number of minutes.', type: 'text', answers: ['20', 'twenty', '20 minutes', 'twenty minutes'], explanation: 'The normal journey is 20 minutes. The timetable allows 30 minutes as a traffic buffer.' },
        { id: 'travel-5', prompt: 'Why was the bicycle-storage area behind the building chosen?', type: 'select', options: ['It is protected from rain', 'It is closest to the main gate', 'It requires no security'], answers: ['It is protected from rain'], explanation: 'The covered location was chosen for weather protection rather than proximity to the main gate.' },
        { id: 'travel-6', prompt: 'How much will a weekly shuttle pass cost after the trial? Write the amount in pounds.', type: 'text', answers: ['12', '£12', '12 pounds', 'twelve', 'twelve pounds'], explanation: 'Travel is free during the trial; the weekly price afterwards is £12.' }
      ]
    },
    {
      id: 'listening-fieldwork',
      title: 'Preparing for a river fieldwork visit',
      description: 'An original academic briefing. Six questions focus on procedure, equipment and interpreting evidence.',
      timeMinutes: 8,
      script: `Before our river fieldwork visit on Thursday, I want to go through the method. Our aim is to compare water conditions at three sites, not to decide whether the whole river is safe to drink from. That would require a much wider investigation.

We will meet outside the science building at eight twenty. The coach leaves at eight thirty, so please do not arrive at half past expecting us to wait. Bring waterproof boots and a packed lunch. Gloves and sample bottles will be provided, and you should not bring your own containers because they may affect the results.

At each site, groups will collect water from the same depth: twenty centimetres below the surface. Take the temperature immediately, before putting the bottle in the shaded storage box. Record the site code and collection time on the label. Write in pencil, since ordinary ink can run when the label gets wet.

Each group will take three samples at every site. Repeating the measurement helps us see whether an unusual result is typical or just a one-off. Please record a surprising reading even if you suspect that something went wrong. Add a note about the possible problem; do not quietly replace the number with one that looks more reasonable.

Back in the laboratory, we will compare the samples and discuss limitations. Recent rainfall can change river conditions, so our measurements describe that particular visit. They will not show every seasonal variation. Your report should include one chart and a short explanation of how the method could be improved. You will have until the following Wednesday to submit it.`,
      questions: [
        { id: 'river-1', prompt: 'What is the main aim of the visit?', type: 'select', options: ['To compare water conditions at three sites', 'To certify the entire river as drinking water', 'To measure every seasonal change'], answers: ['To compare water conditions at three sites'], explanation: 'The speaker states a limited comparison across three sites and explicitly rejects the drinking-water conclusion.' },
        { id: 'river-2', prompt: 'At what time should students meet outside the science building?', type: 'select', options: ['8:20 a.m.', '8:30 a.m.', '9:20 a.m.'], answers: ['8:20 a.m.'], explanation: 'Students meet at 8:20. The coach departs ten minutes later, at 8:30.' },
        { id: 'river-3', prompt: 'How far below the surface should water be collected? Write the number of centimetres.', type: 'text', answers: ['20', 'twenty', '20 centimetres', 'twenty centimetres', '20 centimeters', 'twenty centimeters'], explanation: 'Every group should sample at the same depth: 20 centimetres below the surface.' },
        { id: 'river-4', prompt: 'What should students use to write on the labels? Write ONE WORD.', type: 'text', answers: ['pencil'], explanation: 'Pencil is specified because ordinary ink can run on a wet label.' },
        { id: 'river-5', prompt: 'What should students do with a surprising reading?', type: 'select', options: ['Record it and add a note about any suspected problem', 'Replace it with a more reasonable number', 'Remove it from the results without comment'], answers: ['Record it and add a note about any suspected problem'], explanation: 'The briefing calls for keeping the reading and noting concerns rather than silently altering evidence.' },
        { id: 'river-6', prompt: 'When is the report due? Write ONE DAY.', type: 'text', answers: ['Wednesday', 'the following Wednesday', 'following Wednesday'], explanation: 'The deadline is the Wednesday after the Thursday visit.' }
      ]
    }
  ],
  writing: [
    {
      id: 'writing-task1-transport', title: 'Task 1 · How residents travel to work', taskType: 'task1', minWords: 150, timeMinutes: 20,
      prompt: 'The table shows the percentages of commuters using four main forms of transport in a city in 2005 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      context: 'Illustrative practice data; percentages of all commuters.\nMode | 2005 | 2025\nCar | 58% | 39%\nBus | 24% | 27%\nRail | 12% | 24%\nBicycle | 6% | 10%\nEach column totals 100%.',
      modelAnswer: `The table compares the proportions of commuters travelling by car, bus, rail and bicycle in one city in 2005 and 2025.

Overall, cars remained the most common means of travelling to work, although their share declined substantially. All three alternatives became more popular, with rail recording the largest increase. Cycling continued to account for the smallest proportion of commuters.

In 2005, 58% of workers used a car, considerably more than the combined share of bus and rail passengers, at 36%. By 2025, the proportion travelling by car had fallen by 19 percentage points to 39%. During the same period, the bus figure rose modestly, from 24% to 27%, and remained the second-largest category.

Rail use doubled from 12% to 24%, narrowing its gap with bus travel from 12 percentage points to just three. The share of cyclists also increased, from 6% to 10%, though this change was smaller in absolute terms. Taken together, bus and rail represented just over half of all commuters in 2025, compared with slightly more than one third twenty years earlier.`,
      checklist: ['Give an overview of the main changes and rankings.', 'Use percentage points when subtracting two percentages.', 'Compare categories instead of listing every cell separately.', 'Describe the data without inventing causes.', 'Write at least 150 words in connected paragraphs.']
    },
    {
      id: 'writing-task1-library', title: 'Task 1 · Library visitors by purpose', taskType: 'task1', minWords: 150, timeMinutes: 20,
      prompt: 'The table compares the average numbers of daily library visits for four purposes in 2010 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      context: 'Illustrative practice data; visits per day, classified by each visitor’s main purpose.\nPurpose | 2010 | 2025\nBorrowing books | 240 | 180\nComputer use | 80 | 160\nClasses and workshops | 30 | 120\nQuiet study | 150 | 210\nTotal | 500 | 670',
      modelAnswer: `The table illustrates changes in the average daily number of library visits for four main purposes between 2010 and 2025.

Overall, total attendance increased despite a decline in visits made to borrow books. Quiet study became the largest category, while classes and workshops experienced the most rapid growth. All purposes other than borrowing attracted more visits in the later year.

In 2010, borrowing was the main reason for visiting, with 240 visits per day. This was 90 more than quiet study and three times the figure for computer use. By 2025, borrowing visits had fallen to 180, whereas quiet-study attendance had risen from 150 to 210, making it the most common purpose.

Computer use doubled over the period, increasing from 80 to 160 daily visits. Attendance at classes and workshops rose fourfold, from only 30 to 120. Although this remained the smallest category, its increase of 90 visits was the largest absolute gain among the four purposes. Combined daily attendance consequently climbed from 500 to 670, an increase of 170 visits, with the gains in the other activities more than offsetting the reduction in borrowing.`,
      checklist: ['Include the increase in total attendance and the decline in borrowing in your overview.', 'Distinguish absolute increases from proportional growth.', 'Keep the units as visits per day, not people per year.', 'Do not claim the table explains why behaviour changed.', 'Use figures to support a small number of clear comparisons.']
    },
    {
      id: 'writing-task1-energy', title: 'Task 1 · Electricity from renewable sources', taskType: 'task1', minWords: 150, timeMinutes: 20,
      prompt: 'The table shows the percentage of electricity generated from renewable sources in three countries in 2015, 2025 and a projection for 2035. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      context: 'Illustrative practice data; renewable generation as a percentage of each country’s total electricity. 2035 figures are projections.\nCountry | 2015 | 2025 | 2035 (projected)\nCountry A | 20% | 35% | 50%\nCountry B | 45% | 50% | 55%\nCountry C | 10% | 25% | 60%',
      modelAnswer: `The table compares the proportions of electricity produced from renewable sources in three countries in 2015 and 2025, together with projections for 2035.

Overall, renewable energy accounted for a growing share of electricity generation in all three countries. Country B had the highest proportion in the first two years, but Country C is expected to overtake it by 2035. The projected increase is smallest in Country B.

In 2015, renewables supplied 45% of Country B’s electricity, more than twice the 20% recorded in Country A. Country C was well behind both, at just 10%. Over the following decade, the figures for A and C each rose by 15 percentage points, reaching 35% and 25% respectively. B’s share increased more slowly, to 50%.

By 2035, Country A’s proportion is forecast to reach 50%, while Country B’s is projected to rise to 55%. The most striking change is anticipated in Country C, where the renewable share is expected to climb to 60%. This would represent a gain of 50 percentage points over the full period and place it five points ahead of Country B.`,
      checklist: ['Separate observed years from the 2035 projections.', 'Identify the expected change in the leading country.', 'Compare shares; the table does not give total electricity output.', 'Use forecast language for future figures.', 'Include a clear overview without explaining unprovided causes.']
    },
    {
      id: 'writing-task2-cities', title: 'Task 2 · Greener streets or wider roads?', taskType: 'task2', minWords: 250, timeMinutes: 40,
      prompt: 'Some people believe city governments should spend more money on parks and trees. Others think improving roads should be the priority. Discuss both views and give your own opinion.',
      context: 'Write an academic discussion essay. Address both views and keep your position clear throughout. Use reasons and relevant examples; invented research statistics are unnecessary.',
      modelAnswer: `City governments must decide how to divide limited budgets between transport infrastructure and public green space. Better roads can support essential journeys, but I believe parks and trees deserve greater priority in densely populated areas where basic road access already exists.

Those who favour road improvements point to practical needs. Damaged surfaces can delay buses, increase vehicle maintenance costs and make travel dangerous for cyclists. In growing districts, an inadequate road network may also prevent emergency services and delivery vehicles from reaching residents efficiently. Spending on repairs and safe junctions can therefore produce immediate benefits for a wide range of users. Ignoring these needs in order to create an attractive park would be difficult to justify.

However, prioritising roads does not always mean solving transport problems. Adding lanes can encourage more people to drive, and the extra traffic may eventually fill the new capacity. Parks and trees address a different set of needs that road expansion cannot meet. Shaded walking routes make short journeys more comfortable, while accessible green spaces give residents places to exercise and meet neighbours without paying an entrance fee. This matters particularly for people who live in small flats and have no private garden.

In my view, the appropriate balance depends on existing conditions. A neighbourhood without reliable access needs basic road investment first. Once that requirement is met, additional funding should favour green space and safer walking connections rather than continual widening. For example, a shaded route linking homes to a bus stop can improve both daily comfort and access to public transport.

In conclusion, maintaining a safe road network is essential, but urban investment should not be measured only by how quickly cars can move. In established cities, well-planned greenery offers broader and more lasting improvements to everyday life.`,
      checklist: ['Explain a reasonable argument for each view.', 'State your opinion clearly and maintain it.', 'Develop reasons with specific examples rather than unsupported statistics.', 'Use paragraphs with one main purpose each.', 'Check articles, subject–verb agreement and sentence boundaries.']
    },
    {
      id: 'writing-task2-online', title: 'Task 2 · Online learning at university', taskType: 'task2', minWords: 250, timeMinutes: 40,
      prompt: 'Some universities are replacing face-to-face classes with online courses. Do the advantages of this development outweigh the disadvantages?',
      context: 'Evaluate advantages and disadvantages and reach a clear judgement. Consider different subjects and students instead of assuming all university learning is identical.',
      modelAnswer: `Online courses are becoming a larger part of university education. They can make study more accessible and flexible, but replacing face-to-face teaching completely creates substantial problems. I believe the advantages outweigh the disadvantages only when universities preserve suitable opportunities for practical work and personal interaction.

The clearest benefit is access. Students who live far from a campus can attend lectures without relocating, and those with jobs or caring responsibilities may find recorded lessons easier to fit around daily life. Recordings also allow learners to pause a difficult explanation and revisit it later. A student studying in a second language, for instance, can review unfamiliar technical vocabulary instead of losing the rest of a lecture while trying to understand one term.

Nevertheless, flexibility does not guarantee effective learning. Some students struggle to organise independent study, particularly when they receive little individual guidance. Online discussion can also feel less spontaneous than a conversation after class, making it harder to build relationships with classmates and tutors. In addition, an internet connection and a quiet room cannot be assumed. A student sharing a crowded home may have worse conditions for study than they would on campus.

The subject itself is equally important. A recorded lecture may communicate an economic theory effectively, whereas clinical training or a design workshop requires supervised practice and immediate feedback. Universities should therefore use online delivery selectively. They could provide lectures online while retaining small seminars, laboratory sessions and accessible campus study spaces. Regular feedback and clear weekly goals would help students manage the independent element.

Overall, online learning offers significant benefits, especially for students who would otherwise struggle to attend university. These benefits justify its expansion, but they do not justify removing every face-to-face activity. A carefully supported combination is more valuable than a universal replacement.`,
      checklist: ['Answer whether the advantages outweigh the disadvantages.', 'Explain how and for whom each effect occurs.', 'Avoid treating recorded lectures and practical training as interchangeable.', 'Keep examples relevant to university education.', 'Finish with a judgement consistent with the introduction.']
    },
    {
      id: 'writing-task2-buildings', title: 'Task 2 · Repairing or replacing old buildings', taskType: 'task2', minWords: 250, timeMinutes: 40,
      prompt: 'Governments should encourage the repair and reuse of old buildings rather than their demolition and replacement. To what extent do you agree or disagree?',
      context: 'Develop your degree of agreement. You may distinguish ordinary older buildings from important heritage buildings, and suitable reuse from unsafe or impractical cases.',
      modelAnswer: `Many cities face pressure to replace older buildings as demand for housing and commercial space grows. I largely agree that governments should encourage repair and reuse, because this can conserve resources and retain local character. However, such encouragement should allow exceptions where a building cannot be adapted safely or reasonably.

Reusing an existing structure can avoid some of the material and energy demands of new construction. Foundations, walls and floors may still be serviceable even when their original purpose has disappeared. An unused warehouse, for example, could become a library or a group of workshops instead of being demolished simply because storage businesses have moved elsewhere. Grants for technical assessments or clearer planning guidance would help owners investigate these options before choosing replacement.

There are also social benefits. Familiar buildings can give a neighbourhood a distinctive identity, and their loss may leave residents feeling that redevelopment has ignored the area’s history. This does not mean preserving every old feature unchanged. Sensitive alterations, including better access and improved insulation, can make a building useful while retaining the qualities people value. Public support should encourage that balance rather than treating conservation as a refusal to allow change.

Nevertheless, reuse has limits. Serious structural defects may make repairs unsafe or excessively costly, while an unsuitable layout can prevent a site from meeting urgent public needs. In such cases, a well-designed replacement may be justified. Decisions should be based on an independent assessment of condition, cultural value and realistic alternatives, rather than on age alone or on an automatic preference for the cheapest proposal.

In conclusion, repair and reuse should normally be considered first because they can preserve both physical resources and community identity. Governments should make that option easier, while retaining a transparent process for approving replacement when the evidence supports it.`,
      checklist: ['State the extent of your agreement, not just the topic.', 'Explain the connection between reuse and each claimed benefit.', 'Develop any exceptions without losing your main position.', 'Distinguish encouragement from a complete legal ban on demolition.', 'Check that conclusions follow from the arguments you actually made.']
    }
  ],
  speaking: [
    {
      id: 'speaking-part1-home', title: 'Part 1 · Your home and neighbourhood', part: 'part1', timeMinutes: 3,
      prompt: 'Tell me about the area where you live.',
      followUps: ['What do you like most about your neighbourhood?', 'Is there anything you would like to change about it?', 'Do you think you will live there for a long time? Why?'],
      checklist: ['Answer directly, then add a reason or a specific detail.', 'Use natural spoken sentences rather than a memorised introduction.', 'Use present, past or future forms when the question calls for them.', 'Keep going after a small error; brief self-correction is fine.']
    },
    {
      id: 'speaking-part1-work', title: 'Part 1 · Work or study', part: 'part1', timeMinutes: 3,
      prompt: 'Do you work or are you a student?',
      followUps: ['What do you enjoy most about your work or studies?', 'Is there a part that you find difficult?', 'Would you like to do the same kind of work in the future?'],
      checklist: ['Give enough detail for the listener to understand your situation.', 'Explain preferences instead of giving a list of job duties.', 'Choose precise familiar vocabulary over forced complex expressions.', 'Speak at a comfortable pace and finish your main ideas.']
    },
    {
      id: 'speaking-part1-travel', title: 'Part 1 · Daily travel', part: 'part1', timeMinutes: 3,
      prompt: 'How do you usually travel around your town or city?',
      followUps: ['Has the way you travel changed since you were a child?', 'What do you usually do during a long journey?', 'Is there a form of transport you would like to use more often?'],
      checklist: ['Notice whether a question asks about habit, a past change or a preference.', 'Extend answers with a relevant example.', 'Avoid repeating the same linking word in every sentence.', 'Make key words clear through stress and natural pauses.']
    },
    {
      id: 'speaking-part2-place', title: 'Part 2 · A place that impressed you', part: 'part2', timeMinutes: 3,
      prompt: 'Describe a building or public space that impressed you. You should say where it is, when you visited it, what you noticed about it, and explain why it made an impression on you. Take one minute to prepare, then speak for one to two minutes.',
      followUps: ['Would you recommend that other people visit this place?', 'Has your opinion of it changed since your visit?'],
      checklist: ['Use the preparation minute for short notes, not a full script.', 'Organise the talk around the cue points and a clear main impression.', 'Add concrete observations and explain their significance.', 'Aim for a sustained talk; do not rush to finish every detail.']
    },
    {
      id: 'speaking-part2-skill', title: 'Part 2 · A skill you learned', part: 'part2', timeMinutes: 3,
      prompt: 'Describe a useful skill you learned. You should say what the skill is, when and how you learned it, what was difficult about learning it, and explain how it has helped you. Take one minute to prepare, then speak for one to two minutes.',
      followUps: ['Would you like to teach this skill to someone else?', 'What would you like to learn next?'],
      checklist: ['Make the sequence of learning easy to follow.', 'Use past forms for the learning experience and present forms for its current value.', 'Explain one difficulty with an example instead of listing many.', 'Paraphrase if you cannot immediately remember a word.']
    },
    {
      id: 'speaking-part2-event', title: 'Part 2 · A change of plan', part: 'part2', timeMinutes: 3,
      prompt: 'Describe a time when you had to change an important plan. You should say what you had planned, why the plan changed, what you did instead, and explain how you felt about the result. Take one minute to prepare, then speak for one to two minutes.',
      followUps: ['Would you make the same decision again?', 'Do you usually like to plan things in advance?'],
      checklist: ['Set the situation briefly so you have time for the main event.', 'Connect causes, decisions and results clearly.', 'Use a range of sentence forms that you can control accurately.', 'Let intonation help communicate how you felt.']
    },
    {
      id: 'speaking-part3-cities', title: 'Part 3 · Designing better cities', part: 'part3', timeMinutes: 4,
      prompt: 'What makes a city a good place to live?',
      followUps: ['Should city governments give more space to pedestrians than to cars?', 'How can planners balance the needs of older and younger residents?', 'Do you think cities will become more similar in the future?'],
      checklist: ['Move from personal experience to a broader argument when appropriate.', 'Explain a cause, consequence or comparison rather than just naming factors.', 'Qualify claims when circumstances differ.', 'Support an idea, consider a limitation, and return to the question.']
    },
    {
      id: 'speaking-part3-learning', title: 'Part 3 · Learning throughout life', part: 'part3', timeMinutes: 4,
      prompt: 'Why do some adults continue learning new skills after finishing formal education?',
      followUps: ['Who should pay for training that helps people change careers?', 'Are practical skills as important as academic knowledge?', 'How might technology change the role of teachers?'],
      checklist: ['Develop a general explanation with a relevant example.', 'Compare groups or situations without making absolute assumptions.', 'Use precise vocabulary and paraphrase repeated ideas.', 'Keep your position clear even when considering both sides.']
    },
    {
      id: 'speaking-part3-change', title: 'Part 3 · Decisions and change', part: 'part3', timeMinutes: 4,
      prompt: 'Why do some people find it difficult to adapt to change?',
      followUps: ['Is it better for organisations to make changes quickly or gradually?', 'Should young people make important decisions independently?', 'How can communities prepare for changes they cannot control?'],
      checklist: ['Give reasons and consequences rather than a series of short opinions.', 'Use examples to make an abstract point concrete.', 'Avoid memorised phrases that do not fit the question.', 'Use pauses to group meaning while keeping the answer moving.']
    }
  ]
};

// Original summaries of the public criteria, not official scores or descriptors.
window.IELTS_RUBRICS = {
  note: 'Reading and Listening results are scores for short practice sets, not full-test IELTS bands. AI Writing and Speaking bands are practice estimates, not official examiner results. Typed Speaking cannot establish pronunciation or spoken fluency.',
  sources: [
    { title: 'IELTS scoring in detail', url: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail' },
    { title: 'IELTS Writing preparation and criteria', url: 'https://ielts.org/take-a-test/preparation-resources/writing-test-resources' },
    { title: 'IELTS Speaking band descriptors', url: 'https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf' }
  ],
  writing: [
    { name: 'Task achievement / Task response', description: 'Address the task fully, select and support relevant ideas, and give a clear overview for Task 1 or a developed position for Task 2.' },
    { name: 'Coherence and cohesion', description: 'Organise ideas into purposeful paragraphs and connect them so the reader can follow the progression without forced or excessive linking.' },
    { name: 'Lexical resource', description: 'Use a suitable range of vocabulary precisely, with natural word combinations and control of spelling and word formation.' },
    { name: 'Grammatical range and accuracy', description: 'Use varied sentence forms with control of grammar and punctuation; assess how often errors occur and whether they obscure meaning.' }
  ],
  speaking: [
    { name: 'Fluency and coherence', description: 'Maintain and develop spoken answers in a logical way, considering hesitation, repetition, self-correction and the listener’s ability to follow.' },
    { name: 'Lexical resource', description: 'Express meaning with appropriate, varied vocabulary and paraphrase effectively when a particular word is unavailable.' },
    { name: 'Grammatical range and accuracy', description: 'Use a range of spoken structures with control, considering the frequency and effect of errors.' },
    { name: 'Pronunciation', description: 'Make speech understandable through clear sounds, meaningful stress, rhythm and intonation. This requires audio evidence; an accent alone is not an error.' }
  ]
};
