const { Drug } = require('../models');
const { Op } = require('sequelize');

exports.searchDrugs = async (req, res) => {
  try {
    const query = req.query.q || '';
    const drugs = await Drug.findAll({
      where: {
        name: {
          [Op.iLike]: `%${query}%`
        }
      },
      limit: 20
    });
    res.status(200).json(drugs);
  } catch (err) {
    console.error('Error searching drugs:', err);
    res.status(500).json({ message: 'Failed to search drugs' });
  }
};

exports.getDrugDetails = async (req, res) => {
  try {
    const drug = await Drug.findByPk(req.params.id);
    if (!drug) {
      return res.status(404).json({ message: 'Drug not found' });
    }
    res.status(200).json(drug);
  } catch (err) {
    console.error('Error fetching drug details:', err);
    res.status(500).json({ message: 'Failed to fetch drug details' });
  }
};

exports.autoSeedDrugs = async () => {
  try {
    const count = await Drug.count();
    if (count === 0) {
      console.log('Seeding Drug database...');
      const sampleDrugs = [
        { name: 'Amoxicillin', description: 'Penicillin antibiotic used to treat various bacterial infections.', dosage: '500mg every 8 hours', side_effects: 'Nausea, vomiting, diarrhea, rash.' },
        { name: 'Ibuprofen', description: 'Nonsteroidal anti-inflammatory drug (NSAID) used to reduce fever and treat pain or inflammation.', dosage: '400mg every 4-6 hours as needed', side_effects: 'Upset stomach, mild heartburn, nausea, vomiting.' },
        { name: 'Omeprazole', description: 'Proton pump inhibitor that decreases the amount of acid produced in the stomach.', dosage: '20mg once daily before a meal', side_effects: 'Headache, abdominal pain, diarrhea, nausea.' },
        { name: 'Metformin', description: 'Oral diabetes medicine that helps control blood sugar levels.', dosage: '500mg twice a day with meals', side_effects: 'Nausea, vomiting, stomach upset, diarrhea, weakness.' },
        { name: 'Lisinopril', description: 'ACE inhibitor used to treat high blood pressure (hypertension) or congestive heart failure.', dosage: '10mg once daily', side_effects: 'Dry cough, dizziness, headache, tiredness.' },
        { name: 'Atorvastatin', description: 'Statin medication used to lower blood cholesterol and reduce the risk of heart disease.', dosage: '10-20mg once daily', side_effects: 'Muscle pain, liver problems, diarrhea, joint pain.' },
        { name: 'Azithromycin', description: 'Macrolide antibiotic used to treat various bacterial infections.', dosage: '500mg on day 1, then 250mg for 4 days', side_effects: 'Nausea, vomiting, diarrhea, stomach pain.' },
        { name: 'Amlodipine', description: 'Calcium channel blocker used to treat high blood pressure and chest pain.', dosage: '5mg once daily', side_effects: 'Swelling of legs, tiredness, stomach pain, nausea.' },
        { name: 'Albuterol', description: 'Bronchodilator that relaxes muscles in the airways and increases air flow to the lungs.', dosage: '2 puffs every 4-6 hours as needed', side_effects: 'Nervousness, shaking, headache, fast heart rate.' },
        { name: 'Levothyroxine', description: 'Thyroid medicine that replaces a hormone normally produced by your thyroid gland.', dosage: '50mcg once daily on an empty stomach', side_effects: 'Weight changes, headache, trouble sleeping, feeling nervous.' },
        { name: 'Gabapentin', description: 'Anti-epileptic drug used to treat seizures and pain caused by nerve damage.', dosage: '300mg three times a day', side_effects: 'Dizziness, drowsiness, tiredness, loss of coordination.' },
        { name: 'Sertraline', description: 'Selective serotonin reuptake inhibitor (SSRI) used to treat depression, anxiety, and other mood disorders.', dosage: '50mg once daily', side_effects: 'Nausea, sleep problems, dry mouth, tiredness.' },
        { name: 'Losartan', description: 'Angiotensin II receptor antagonist used to keep blood vessels from narrowing, which lowers blood pressure.', dosage: '50mg once daily', side_effects: 'Dizziness, tiredness, back pain, stuffy nose.' },
        { name: 'Furosemide', description: 'Loop diuretic (water pill) that prevents your body from absorbing too much salt.', dosage: '20-80mg once daily', side_effects: 'Frequent urination, thirst, muscle cramps, weakness.' },
        { name: 'Pantoprazole', description: 'Proton pump inhibitor used to treat certain conditions in which there is too much acid in the stomach.', dosage: '40mg once daily', side_effects: 'Headache, diarrhea, stomach pain, nausea.' },
        { name: 'Metoprolol', description: 'Beta-blocker that affects the heart and circulation, used to treat angina and hypertension.', dosage: '50mg twice daily', side_effects: 'Dizziness, tired feeling, depression, confusion.' },
        { name: 'Escitalopram', description: 'SSRI antidepressant used to treat anxiety in adults.', dosage: '10mg once daily', side_effects: 'Nausea, dry mouth, trouble sleeping, constipation.' },
        { name: 'Montelukast', description: 'Leukotriene inhibitor used to prevent asthma attacks in adults and children.', dosage: '10mg once daily in the evening', side_effects: 'Stomach pain, diarrhea, fever, headache.' },
        { name: 'Rosuvastatin', description: 'Statin medication used together with diet to lower blood levels of "bad" cholesterol.', dosage: '10-20mg once daily', side_effects: 'Headache, muscle aches, abdominal pain, weakness.' },
        { name: 'Fluoxetine', description: 'SSRI antidepressant used to treat major depressive disorder, bulimia nervosa, obsessive-compulsive disorder.', dosage: '20mg once daily in the morning', side_effects: 'Sleep problems, nausea, loss of appetite, dry mouth.' },
      ];
      await Drug.bulkCreate(sampleDrugs);
      console.log('Successfully seeded 20 drugs.');
    }
  } catch (err) {
    console.error('Error auto-seeding drugs:', err);
  }
};
