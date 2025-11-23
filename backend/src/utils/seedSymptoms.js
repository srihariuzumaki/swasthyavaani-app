import mongoose from 'mongoose';
import Symptom from '../models/Symptom.js';
import Medicine from '../models/Medicine.js';

/**
 * Seed symptoms with medicine mappings
 */
export const seedSymptoms = async () => {
    try {
        console.log('Seeding symptoms...');

        // Get medicine IDs for mapping
        const paracetamol = await Medicine.findOne({ name: /paracetamol/i });
        const cetirizine = await Medicine.findOne({ name: /cetirizine/i });
        const ibuprofen = await Medicine.findOne({ name: /ibuprofen/i });
        const omeprazole = await Medicine.findOne({ name: /omeprazole/i });
        const loperamide = await Medicine.findOne({ name: /loperamide/i });

        const symptoms = [
            {
                name: 'Headache',
                category: 'neurological',
                severity: 'mild',
                description: 'Pain or discomfort in the head, scalp, or neck',
                commonCauses: ['Stress', 'Dehydration', 'Lack of sleep', 'Eye strain'],
                suggestedMedicines: paracetamol ? [{
                    medicine: paracetamol._id,
                    dosage: '500mg every 4-6 hours',
                    notes: 'Do not exceed 4000mg in 24 hours'
                }] : [],
                homeRemedies: [
                    'Rest in a quiet, dark room',
                    'Apply cold or warm compress',
                    'Stay hydrated',
                    'Practice relaxation techniques'
                ],
                whenToSeeDoctor: [
                    'Severe or sudden headache',
                    'Headache with fever, stiff neck, or confusion',
                    'Headache after head injury',
                    'Chronic or worsening headaches'
                ],
                searchKeywords: ['head pain', 'migraine', 'tension headache'],
                translations: {
                    en: { name: 'Headache', description: 'Pain or discomfort in the head, scalp, or neck' },
                    hi: { name: 'सिरदर्द', description: 'सिर, खोपड़ी या गर्दन में दर्द या असुविधा' },
                    ta: { name: 'தலைவலி', description: 'தலை, உச்சந்தலை அல்லது கழுத்தில் வலி அல்லது அசெளகரியம்' },
                    te: { name: 'తలనొప్పి', description: 'తల, నెత్తి లేదా మెడలో నొప్పి లేదా అసౌకర్యం' },
                    bn: { name: 'মাথাব্যথা', description: 'মাথা, মাথার ত্বক বা ঘাড়ে ব্যথা বা অস্বস্তি' },
                    mr: { name: 'डोकेदुखी', description: 'डोके, टाळू किंवा मानेमध्ये वेदना किंवा अस्वस্থता' },
                    gu: { name: 'માથાનો દુખાવો', description: 'માથા, ખોપરી અથવા ગરદનમાં દુખાવો અથવા અસ્વસ્થતા' },
                    kn: { name: 'ತಲೆನೋವು', description: 'ತಲೆ, ತಲೆಬುರುಡೆ ಅಥವಾ ಕುತ್ತಿಗೆಯಲ್ಲಿ ನೋವು ಅಥವಾ ಅಸ್ವಸ್ಥತೆ' }
                }
            },
            {
                name: 'Fever',
                category: 'immune',
                severity: 'moderate',
                description: 'Elevated body temperature above 100.4°F (38°C)',
                commonCauses: ['Viral infection', 'Bacterial infection', 'Inflammation'],
                suggestedMedicines: paracetamol ? [{
                    medicine: paracetamol._id,
                    dosage: '500-1000mg every 4-6 hours',
                    notes: 'Take with food if stomach upset occurs'
                }] : [],
                homeRemedies: [
                    'Rest and stay hydrated',
                    'Take lukewarm bath',
                    'Wear light clothing',
                    'Use cool compress on forehead'
                ],
                whenToSeeDoctor: [
                    'Fever above 103°F (39.4°C)',
                    'Fever lasting more than 3 days',
                    'Fever with severe headache or rash',
                    'Difficulty breathing'
                ],
                searchKeywords: ['high temperature', 'pyrexia', 'hot'],
                translations: {
                    en: { name: 'Fever', description: 'Elevated body temperature above 100.4°F (38°C)' },
                    hi: { name: 'बुखार', description: '100.4°F (38°C) से ऊपर शरीर का तापमान' },
                    ta: { name: 'காய்ச்சல்', description: '100.4°F (38°C) க்கு மேல் உடல் வெப்பநிலை' },
                    te: { name: 'జ్వరం', description: '100.4°F (38°C) కంటే ఎక్కువ శరీర ఉష్ణోగ్రత' },
                    bn: { name: 'জ্বর', description: '100.4°F (38°C) এর উপরে শরীরের তাপমাত্রা' },
                    mr: { name: 'ताप', description: '100.4°F (38°C) पेक्षा जास्त शरीराचे तापमान' },
                    gu: { name: 'તાવ', description: '100.4°F (38°C) થી વધુ શરીરનું તાપમાન' },
                    kn: { name: 'ಜ್ವರ', description: '100.4°F (38°C) ಗಿಂತ ಹೆಚ್ಚು ದೇಹದ ಉಷ್ಣತೆ' }
                }
            },
            {
                name: 'Cough',
                category: 'respiratory',
                severity: 'mild',
                description: 'Sudden expulsion of air from the lungs',
                commonCauses: ['Common cold', 'Allergies', 'Asthma', 'Smoking'],
                suggestedMedicines: [],
                homeRemedies: [
                    'Drink warm liquids',
                    'Use honey (for adults)',
                    'Stay hydrated',
                    'Use humidifier',
                    'Avoid irritants and smoke'
                ],
                whenToSeeDoctor: [
                    'Cough lasting more than 3 weeks',
                    'Coughing up blood',
                    'Difficulty breathing',
                    'Chest pain',
                    'High fever with cough'
                ],
                searchKeywords: ['coughing', 'throat irritation', 'dry cough', 'wet cough'],
                translations: {
                    en: { name: 'Cough', description: 'Sudden expulsion of air from the lungs' },
                    hi: { name: 'खांसी', description: 'फेफड़ों से हवा का अचानक निष्कासन' },
                    ta: { name: 'இருமல்', description: 'நுரையீரலில் இருந்து காற்று திடீரென வெளியேறுதல்' },
                    te: { name: 'దగ్గు', description: 'ఊపిరితిత్తుల నుండి గాలి అకస్మాత్తుగా బయటకు రావడం' },
                    bn: { name: 'কাশি', description: 'ফুসফুস থেকে হঠাৎ বাতাস বের হওয়া' },
                    mr: { name: 'खोकला', description: 'फुफ्फुसातून हवेचे अचानक बाहेर पडणे' },
                    gu: { name: 'ઉધરસ', description: 'ફેફસાંમાંથી હવાનું અચાનક બહાર નીકળવું' },
                    kn: { name: 'ಕೆಮ್ಮು', description: 'ಶ್ವಾಸಕೋಶದಿಂದ ಗಾಳಿಯ ಹಠಾತ್ ಹೊರಹಾಕುವಿಕೆ' }
                }
            },
            {
                name: 'Cold',
                category: 'respiratory',
                severity: 'mild',
                description: 'Viral infection of the upper respiratory tract',
                commonCauses: ['Rhinovirus', 'Coronavirus', 'Adenovirus'],
                suggestedMedicines: cetirizine ? [{
                    medicine: cetirizine._id,
                    dosage: '10mg once daily',
                    notes: 'For runny nose and sneezing'
                }] : [],
                homeRemedies: [
                    'Rest and sleep',
                    'Drink plenty of fluids',
                    'Gargle with salt water',
                    'Use saline nasal drops',
                    'Eat nutritious food'
                ],
                whenToSeeDoctor: [
                    'Symptoms lasting more than 10 days',
                    'High fever',
                    'Severe sinus pain',
                    'Difficulty breathing'
                ],
                searchKeywords: ['runny nose', 'congestion', 'sneezing', 'common cold'],
                translations: {
                    en: { name: 'Cold', description: 'Viral infection of the upper respiratory tract' },
                    hi: { name: 'सर्दी', description: 'ऊपरी श्वसन पथ का वायरल संक्रमण' },
                    ta: { name: 'சளி', description: 'மேல் சுவாச பாதையின் வைரஸ் தொற்று' },
                    te: { name: 'జలుబు', description: 'ఎగువ శ్వాసకోశ మార్గం యొక్క వైరల్ ఇన్ఫెక్షన్' },
                    bn: { name: 'সর্দি', description: 'উপরের শ্বাসযন্ত্রের ভাইরাল সংক্রমণ' },
                    mr: { name: 'सर्दी', description: 'वरच्या श्वसनमार्गाचा विषाणूजन्य संसर्ग' },
                    gu: { name: 'શરદી', description: 'ઉપલા શ્વસન માર્ગનો વાયરલ ચેપ' },
                    kn: { name: 'ಶೀತ', description: 'ಮೇಲಿನ ಉಸಿರಾಟದ ಪಥದ ವೈರಲ್ ಸೋಂಕು' }
                }
            },
            {
                name: 'Body Pain',
                category: 'musculoskeletal',
                severity: 'mild',
                description: 'Aches and pains throughout the body',
                commonCauses: ['Flu', 'Overexertion', 'Stress', 'Lack of sleep'],
                suggestedMedicines: ibuprofen ? [{
                    medicine: ibuprofen._id,
                    dosage: '400mg every 6-8 hours',
                    notes: 'Take with food to avoid stomach upset'
                }] : [],
                homeRemedies: [
                    'Rest and relaxation',
                    'Warm bath or shower',
                    'Gentle stretching',
                    'Massage',
                    'Stay hydrated'
                ],
                whenToSeeDoctor: [
                    'Severe or persistent pain',
                    'Pain with fever',
                    'Pain after injury',
                    'Joint swelling or redness'
                ],
                searchKeywords: ['muscle pain', 'aches', 'myalgia', 'body ache'],
                translations: {
                    en: { name: 'Body Pain', description: 'Aches and pains throughout the body' },
                    hi: { name: 'शरीर दर्द', description: 'पूरे शरीर में दर्द और पीड़ा' },
                    ta: { name: 'உடல் வலி', description: 'உடல் முழுவதும் வலிகள்' },
                    te: { name: 'శరీర నొప్పి', description: 'శరీరం అంతటా నొప్పులు' },
                    bn: { name: 'শরীরে ব্যথা', description: 'সারা শরীরে ব্যথা এবং যন্ত্রণা' },
                    mr: { name: 'शरीर दुखणे', description: 'संपूर्ण शरीरात वेदना आणि दुखणे' },
                    gu: { name: 'શરીર દુખાવો', description: 'સમગ્ર શરીરમાં દુખાવો અને પીડા' },
                    kn: { name: 'ದೇಹ ನೋವು', description: 'ದೇಹದಾದ್ಯಂತ ನೋವುಗಳು' }
                }
            },
            {
                name: 'Nausea',
                category: 'digestive',
                severity: 'mild',
                description: 'Feeling of sickness with an urge to vomit',
                commonCauses: ['Food poisoning', 'Motion sickness', 'Pregnancy', 'Medication'],
                suggestedMedicines: [],
                homeRemedies: [
                    'Sip clear fluids slowly',
                    'Eat bland foods (crackers, toast)',
                    'Avoid strong odors',
                    'Get fresh air',
                    'Rest in upright position'
                ],
                whenToSeeDoctor: [
                    'Severe vomiting',
                    'Blood in vomit',
                    'Signs of dehydration',
                    'Severe abdominal pain',
                    'Nausea lasting more than 24 hours'
                ],
                searchKeywords: ['sick feeling', 'queasy', 'upset stomach', 'vomiting'],
                translations: {
                    en: { name: 'Nausea', description: 'Feeling of sickness with an urge to vomit' },
                    hi: { name: 'मतली', description: 'उल्टी करने की इच्छा के साथ बीमारी की भावना' },
                    ta: { name: 'குமட்டல்', description: 'வாந்தி எடுக்க வேண்டும் என்ற உணர்வுடன் நோய் உணர்வு' },
                    te: { name: 'వాంతులు', description: 'వాంతి చేయాలనే కోరికతో అనారోగ్య భావన' },
                    bn: { name: 'বমি বমি ভাব', description: 'বমি করার ইচ্ছা সহ অসুস্থতার অনুভূতি' },
                    mr: { name: 'मळमळ', description: 'उलट्या करण्याची इच्छा असलेली आजारपणाची भावना' },
                    gu: { name: 'ઉબકા', description: 'ઉલટી કરવાની ઇચ્છા સાથે માંદગીની લાગણી' },
                    kn: { name: 'ವಾಕರಿಕೆ', description: 'ವಾಂತಿ ಮಾಡುವ ಪ್ರಚೋದನೆಯೊಂದಿಗೆ ಅನಾರೋಗ್ಯದ ಭಾವನೆ' }
                }
            },
            {
                name: 'Dizziness',
                category: 'neurological',
                severity: 'moderate',
                description: 'Feeling of lightheadedness or unsteadiness',
                commonCauses: ['Low blood pressure', 'Dehydration', 'Inner ear problems', 'Anemia'],
                suggestedMedicines: [],
                homeRemedies: [
                    'Sit or lie down immediately',
                    'Drink water',
                    'Avoid sudden movements',
                    'Eat regular meals',
                    'Get adequate sleep'
                ],
                whenToSeeDoctor: [
                    'Frequent or severe dizziness',
                    'Dizziness with chest pain',
                    'Fainting',
                    'Severe headache with dizziness',
                    'Difficulty walking'
                ],
                searchKeywords: ['vertigo', 'lightheaded', 'spinning', 'balance problems'],
                translations: {
                    en: { name: 'Dizziness', description: 'Feeling of lightheadedness or unsteadiness' },
                    hi: { name: 'चक्कर आना', description: 'हल्कापन या अस्थिरता की भावना' },
                    ta: { name: 'தலைச்சுற்றல்', description: 'தலைச்சுற்றல் அல்லது சமநிலையின்மை உணர்வு' },
                    te: { name: 'తల తిరగడం', description: 'తలతిరగడం లేదా అస్థిరత అనుభూతి' },
                    bn: { name: 'মাথা ঘোরা', description: 'হালকা মাথা বা অস্থিরতার অনুভূতি' },
                    mr: { name: 'चक्कर येणे', description: 'डोके हलके होणे किंवा अस्थिरतेची भावना' },
                    gu: { name: 'ચક્કર', description: 'માથું હલકું થવું અથવા અસ્થિરતાની લાગણી' },
                    kn: { name: 'ತಲೆತಿರುಗುವಿಕೆ', description: 'ತಲೆ ಹಗುರವಾಗುವ ಅಥವಾ ಅಸ್ಥಿರತೆಯ ಭಾವನೆ' }
                }
            },
            {
                name: 'Fatigue',
                category: 'other',
                severity: 'mild',
                description: 'Extreme tiredness and lack of energy',
                commonCauses: ['Lack of sleep', 'Stress', 'Poor diet', 'Anemia', 'Thyroid problems'],
                suggestedMedicines: [],
                homeRemedies: [
                    'Get 7-9 hours of sleep',
                    'Exercise regularly',
                    'Eat balanced diet',
                    'Manage stress',
                    'Stay hydrated',
                    'Take vitamin supplements'
                ],
                whenToSeeDoctor: [
                    'Persistent fatigue despite rest',
                    'Fatigue with other symptoms',
                    'Sudden onset of severe fatigue',
                    'Fatigue affecting daily activities'
                ],
                searchKeywords: ['tired', 'exhausted', 'weakness', 'low energy'],
                translations: {
                    en: { name: 'Fatigue', description: 'Extreme tiredness and lack of energy' },
                    hi: { name: 'थकान', description: 'अत्यधिक थकान और ऊर्जा की कमी' },
                    ta: { name: 'சோர்வு', description: 'அதிக சோர்வு மற்றும் ஆற்றல் பற்றாக்குறை' },
                    te: { name: 'అలసట', description: 'తీవ్ర అలసట మరియు శక్తి లేమి' },
                    bn: { name: 'ক্লান্তি', description: 'চরম ক্লান্তি এবং শক্তির অভাব' },
                    mr: { name: 'थकवा', description: 'अत्यंत थकवा आणि ऊर्जेची कमतरता' },
                    gu: { name: 'થાક', description: 'અતિશય થાક અને ઊર્જાનો અભાવ' },
                    kn: { name: 'ಆಯಾಸ', description: 'ತೀವ್ರ ಆಯಾಸ ಮತ್ತು ಶಕ್ತಿಯ ಕೊರತೆ' }
                }
            },
            {
                name: 'Sore Throat',
                category: 'respiratory',
                severity: 'mild',
                description: 'Pain, scratchiness, or irritation of the throat',
                commonCauses: ['Viral infection', 'Bacterial infection', 'Allergies', 'Dry air'],
                suggestedMedicines: paracetamol ? [{
                    medicine: paracetamol._id,
                    dosage: '500mg every 4-6 hours',
                    notes: 'For pain relief'
                }] : [],
                homeRemedies: [
                    'Gargle with warm salt water',
                    'Drink warm liquids',
                    'Use throat lozenges',
                    'Stay hydrated',
                    'Use humidifier',
                    'Rest your voice'
                ],
                whenToSeeDoctor: [
                    'Severe throat pain',
                    'Difficulty swallowing or breathing',
                    'High fever',
                    'Symptoms lasting more than a week',
                    'Rash or joint pain'
                ],
                searchKeywords: ['throat pain', 'pharyngitis', 'strep throat'],
                translations: {
                    en: { name: 'Sore Throat', description: 'Pain, scratchiness, or irritation of the throat' },
                    hi: { name: 'गले में खराश', description: 'गले में दर्द, खरोंच या जलन' },
                    ta: { name: 'தொண்டை வலி', description: 'தொண்டையில் வலி, கீறல் அல்லது எரிச்சல்' },
                    te: { name: 'గొంతు నొప్పి', description: 'గొంతులో నొప్పి, గోకడం లేదా చికాకు' },
                    bn: { name: 'গলা ব্যথা', description: 'গলায় ব্যথা, আঁচড় বা জ্বালা' },
                    mr: { name: 'घसा खवखवणे', description: 'घशात दुखणे, खाज सुटणे किंवा जळजळ' },
                    gu: { name: 'ગળામાં દુખાવો', description: 'ગળામાં દુખાવો, ખંજવાળ અથવા બળતરા' },
                    kn: { name: 'ಗಂಟಲು ನೋವು', description: 'ಗಂಟಲಿನಲ್ಲಿ ನೋವು, ಕೆರೆತ ಅಥವಾ ಕಿರಿಕಿರಿ' }
                }
            },
            {
                name: 'Chest Pain',
                category: 'cardiovascular',
                severity: 'severe',
                description: 'Discomfort or pain in the chest area',
                commonCauses: ['Heart problems', 'Lung issues', 'Muscle strain', 'Acid reflux'],
                suggestedMedicines: omeprazole ? [{
                    medicine: omeprazole._id,
                    dosage: '20mg once daily',
                    notes: 'Only if pain is due to acid reflux'
                }] : [],
                homeRemedies: [],
                whenToSeeDoctor: [
                    'SEEK IMMEDIATE MEDICAL ATTENTION',
                    'Chest pain with shortness of breath',
                    'Pain radiating to arm, jaw, or back',
                    'Sudden severe chest pain',
                    'Chest pain with sweating or nausea'
                ],
                searchKeywords: ['chest discomfort', 'angina', 'heart pain'],
                translations: {
                    en: { name: 'Chest Pain', description: 'Discomfort or pain in the chest area' },
                    hi: { name: 'सीने में दर्द', description: 'छाती के क्षेत्र में असुविधा या दर्द' },
                    ta: { name: 'மார்பு வலி', description: 'மார்பு பகுதியில் அசெளகரியம் அல்லது வலி' },
                    te: { name: 'ఛాతీ నొప్పి', description: 'ఛాతీ ప్రాంతంలో అసౌకర్యం లేదా నొప్పి' },
                    bn: { name: 'বুকে ব্যথা', description: 'বুকের এলাকায় অস্বস্তি বা ব্যথা' },
                    mr: { name: 'छातीत दुखणे', description: 'छातीच्या भागात अस्वस्थता किंवा वेदना' },
                    gu: { name: 'છાતીમાં દુખાવો', description: 'છાતીના વિસ્તારમાં અસ્વસ્થતા અથવા દુખાવો' },
                    kn: { name: 'ಎದೆ ನೋವು', description: 'ಎದೆ ಪ್ರದೇಶದಲ್ಲಿ ಅಸ್ವಸ್ಥತೆ ಅಥವಾ ನೋವು' }
                }
            }
        ];

        // Clear existing symptoms
        await Symptom.deleteMany({});

        // Insert new symptoms
        const createdSymptoms = await Symptom.insertMany(symptoms);

        console.log(`✅ Successfully seeded ${createdSymptoms.length} symptoms`);
        return createdSymptoms;
    } catch (error) {
        console.error('Error seeding symptoms:', error);
        throw error;
    }
};
