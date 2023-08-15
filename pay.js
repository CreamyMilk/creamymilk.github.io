const serverIp = "https://mpesa-bridge.onrender.com";
const TENN_PAYMENTS_GQL_URL = `${serverIp}/query`;
const API_KEY = "0xb0c0186943f5848670ca62980046966b3f11a1f1";

async function sendDepositRequests(amountInCents, phoneNumber) {
  let depositInput = {
    amountInCents: amountInCents,
    userPhoneNumber: phoneNumber,
  };

  const depositMutation = `
  mutation InitiateDeposit($input: NewDeposit!) {
    initateDeposit(input: $input) {
      Txid
      Status
      MpesaFallback {
        paybill
        accountNumber
      }
    }
  }
  `;

  const payload = {
    method: "POST",
    body: JSON.stringify({
      query: depositMutation,
      variables: { input: depositInput },
    }),
    headers: {
      Authorization: "Bearer " + API_KEY,
      "Content-Type": "application/json",
    },
  };

  var response;
  try {
    response = await fetch(TENN_PAYMENTS_GQL_URL, payload);
  } catch (err) {
    console.error(err);
  }

  let responseBody = await response.json();

  return responseBody;
}

async function FetchTransactionStatus(transationId) {
  const gqlquery = `
  query fetchTransactionStatus($Txid: String!) {
    fetchTransactionByTxId(Txid: $Txid) {
      id
      amount
      mpesaReference
      type
      status
      completedAt
      payerPhoneNumber
      initatedPhoneNumber
    }
  }`;

  const payload = {
    method: "post",
    body: JSON.stringify({
      query: gqlquery,
      variables: { Txid: transationId },
    }),
    headers: {
      Authorization: "Bearer " + API_KEY,
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(TENN_PAYMENTS_GQL_URL, payload);
  const responseBody = await response.json();

  console.log(responseBody);

  return responseBody;
}

async function Pay(amountInCents, phoneNumber, callbackFunc) {
  let paymentInfo = await sendDepositRequests(amountInCents, phoneNumber);
  let txId = paymentInfo.data.initateDeposit.Txid;
  let counter = 0;

  let intervalID = setInterval(
    async (param1) => {
      counter++;
      if (counter > 10) {
        clearInterval(intervalID);
      }

      let statusLookup = await FetchTransactionStatus(param1);
      console.log("checking", statusLookup);
      if (statusLookup.data.fetchTransactionByTxId.status != "INITIATED") {
        console.log("DONE");
        clearInterval(intervalID);

        callbackFunc(statusLookup)
      }
    },
    3000,
    txId
  );
}

console.log("SDK Loaded ✅")
