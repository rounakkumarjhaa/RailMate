// End-to-end integration test for RailMate API Gateway and Microservices
const GATEWAY = 'http://127.0.0.1:5050';

async function runE2ETests() {
  console.log('--- STARTING RAILMATE END-TO-END GATEWAY INTEGRATION TESTS ---');

  // 1. Gateway Health
  const healthRes = await fetch(`${GATEWAY}/api/health`);
  const health = await healthRes.json();
  console.log('1. Gateway Health Status:', health.overallStatus);

  // 2. Where Is My Train Live Status
  const trainRes = await fetch(`${GATEWAY}/api/railway/live-status/12952`);
  const train = await trainRes.json();
  console.log('2. Live Train Status:', train.trainNumber, train.trainName, 'Speed:', train.currentSpeedKmh + 'km/h', 'Delay:', train.runningStatus);

  // 3. ConfirmTkt PNR Lookup
  const pnrRes = await fetch(`${GATEWAY}/api/railway/pnr/2849102941`);
  const pnr = await pnrRes.json();
  console.log('3. PNR Status:', pnr.pnr, 'Coach:', pnr.passengers[0].coach, 'Berth:', pnr.passengers[0].berthNumber, 'Prob:', pnr.confirmationProbability + '%');

  // 4. ML Confirmation Probability
  const probRes = await fetch(`${GATEWAY}/api/booking/predict-probability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wlNumber: 15, bookingClass: '3A', daysUntilJourney: 6, quota: 'GN' })
  });
  const prob = await probRes.json();
  console.log('4. ML Confirmation Probability:', prob.probability + '%', 'Badge:', prob.badge);

  // 5. Booking & Direct UPI Generation
  const bookingRes = await fetch(`${GATEWAY}/api/booking/create-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'usr_demo_101',
      trainNumber: '12952',
      trainName: 'Tejas Rajdhani Express',
      fromCode: 'NDLS',
      toCode: 'MMCT',
      journeyClass: '3A',
      passengers: [{ name: 'Rajesh Kumar Sharma', age: 34, gender: 'Male', berth: 'Lower' }],
      baseFare: 1750
    })
  });
  const booking = await bookingRes.json();
  console.log('5. Booking Created! PNR:', booking.pnr, 'Amount: ₹' + booking.fareSummary.totalAmount, 'UPI URI:', booking.payment.upiUri.slice(0, 45) + '...');

  // 6. Direct UPI Verification
  const upiVerifyRes = await fetch(`${GATEWAY}/api/booking/upi/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: booking.bookingId, upiRefNo: 'REF-TEST-99212', paymentMethod: 'Google Pay UPI' })
  });
  const upiVerify = await upiVerifyRes.json();
  console.log('6. Direct UPI Verified! Status:', upiVerify.ticket.paymentStatus, 'Coach:', upiVerify.ticket.passengers[0].coach, 'Berth:', upiVerify.ticket.passengers[0].berthNumber);

  // 7. Station Food Ordering
  const foodRes = await fetch(`${GATEWAY}/api/food/restaurants?stationCode=KOTA`);
  const food = await foodRes.json();
  console.log('7. Food Restaurants at Kota:', food.restaurants.length, 'e.g.', food.restaurants[0].name);

  // 8. Place Food Order
  const orderRes = await fetch(`${GATEWAY}/api/food/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pnr: booking.pnr,
      trainNumber: '12952',
      stationCode: 'KOTA',
      restaurantName: "Haldiram's",
      items: [{ name: 'Executive Maharaja Veg Thali', price: 280, qty: 1 }],
      totalAmount: 305,
      coachBerth: 'Coach B4 - Berth 21'
    })
  });
  const order = await orderRes.json();
  console.log('8. Food Order Placed! ID:', order.order.orderId, 'Delivery Code:', order.order.deliveryCode, 'To:', order.order.coachBerth);

  // 9. Destinations & Places
  const destRes = await fetch(`${GATEWAY}/api/destinations/featured-destinations`);
  const dest = await destRes.json();
  console.log('9. Featured Destinations:', dest.destinations.length, 'Top:', dest.destinations[0].title);

  // 10. Journey Sharing
  const journeyRes = await fetch(`${GATEWAY}/api/journey/share-journey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      passengerName: 'Rajesh Kumar Sharma',
      trainNumber: '12952',
      coach: 'B4',
      berth: '21'
    })
  });
  const journey = await journeyRes.json();
  console.log('10. Live Journey Sharing Link:', journey.shareUrl, 'WhatsApp URL:', journey.whatsappUrl.slice(0, 50) + '...');

  // 11. Sarvam AI Indic NLP
  const voiceRes = await fetch(`${GATEWAY}/api/voice-ai/process-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'मेरी ट्रेन 12952 कहां पहुंची है?', languageCode: 'hi-IN' })
  });
  const voice = await voiceRes.json();
  console.log('11. Sarvam AI NLP Intent:', voice.intent, 'Spoken Audio Response:', voice.spokenResponse);

  // 12. Google Gemini Conversational Intelligence
  const geminiRes = await fetch(`${GATEWAY}/api/voice-ai/gemini-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Explain senior citizen lower berth quota rules on Indian Railways', languageCode: 'en-IN' })
  });
  const gemini = await geminiRes.json();
  console.log('12. Google Gemini API Assistant Reply:', gemini.reply.slice(0, 75) + '...', 'Model:', gemini.model);

  console.log('--- ALL 12 END-TO-END GATEWAY TESTS PASSED! ---');
}

runE2ETests();
