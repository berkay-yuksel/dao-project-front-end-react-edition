import React, { useEffect, useState } from "react";
import "./pages.css";
import {  Widget, Tag, Table, Form } from "web3uikit";
import { Link } from "react-router-dom";
import { useMoralis, useMoralisWeb3Api, useWeb3ExecuteFunction } from "react-moralis";

const Home = () => {
  const [passRate, setPassRate] = useState(0);
  const [totalP, setTotalP] = useState(0);
  const [counted, setCounted] = useState(0);
  const [voters, setVoters] = useState(0);
  const { Moralis, isInitialized } = useMoralis();
  const [proposals, setProposals] = useState();
  const Web3Api = useMoralisWeb3Api();
  const [sub, setSub] = useState();
  const contractProcessor = useWeb3ExecuteFunction();


  async function createProposal(newProposal) {
    let options = {
      contractAddress: "0x7D313ce46b24D71D2e76b927B0548D91e0B61DE0",
      functionName: "createProposal",
      abi: [
        {
          inputs: [
            {
              internalType: "string",
              name: "_description",
              type: "string",
            },
            {
              internalType: "address[]",
              name: "_canVote",
              type: "address[]",
            },
          ],
          name: "createProposal",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      params: {
        _description: newProposal,
        _canVote: voters,
      },
    };
    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        console.log("Proposal Succesful");
        setSub(false);
      },
      onError: (error) => {
        alert(error.data.message);
        setSub(false);
      },
    });
  }


  async function getStatus(proposalId) {
    const proposalCountTable = Moralis.Object.extend("proposalCountTable");
    const query = new Moralis.Query(proposalCountTable);
    query.equalTo("uid", proposalId);
    const result = await query.first();
    if (result !== undefined) {
      if (result.attributes.passed) {
        return { background:"lightgreen!important", color: "green", text: "Passed" };
      } else {
        return { background:"rgb(255, 126, 126)!important",color: "red", text: "Rejected" };
      }
    } else {
      return { background:"lightblue!important",color: "blue", text: "Ongoing" };
    }
  }

  useEffect(() => {
    if (isInitialized) {

      async function getProposals() {
        const CreatedProposals = Moralis.Object.extend("CreatedProposals");
        const query = new Moralis.Query(CreatedProposals);
        query.descending("uid_decimal");
        const results = await query.find();
        const table = await Promise.all(
          results.map(async (e) => [
            e.attributes.uid,
            e.attributes.description,
            <Link to="/proposal" state={{
              description: e.attributes.description,
              background: (await getStatus(e.attributes.uid)).background,
              color: (await getStatus(e.attributes.uid)).color,
              text: (await getStatus(e.attributes.uid)).text,
              id: e.attributes.uid,
              proposer: e.attributes.proposer
              
              }}>
              <Tag
                background={(await getStatus(e.attributes.uid)).background}
                color={(await getStatus(e.attributes.uid)).color}
                text={(await getStatus(e.attributes.uid)).text}
              />
            </Link>,
          ])
        );
        setProposals(table);
        setTotalP(results.length);
      }




      async function getPassRate() {
        const proposalCountTable = Moralis.Object.extend("proposalCountTable");
        const query = new Moralis.Query(proposalCountTable);
        const results = await query.find();
        let votesUp = 0;

        results.forEach((e) => {
          if (e.attributes.passed) {
            votesUp++;
          }
        });

        setCounted(results.length);
        setPassRate((votesUp / results.length) * 100);
      }


      const fetchTokenIdOwners = async () => {
        const options = {
      address:"0x88B48F654c30e99bc2e4A1559b4Dcf1aD93FA656",
      token_id:"58538135596029509329456146620683606546470122578009882867137711147461097029832",
      chain:"rinkeby"
        };
        const tokenIdOwners = await Web3Api.token.getTokenIdOwners(options);
        const addresses = tokenIdOwners.result.map((e) => e.owner_of);
        setVoters(addresses);
      };


      fetchTokenIdOwners();
      getProposals();
      getPassRate();
      
    }
  }, [isInitialized]);


  return (
    <>
      <div className="content">
      
            {proposals && (
            <div className="tabContent">
              Overview
              <div className="widgets">
                <Widget
                  info={totalP}
                  title="Proposals Created"
                  style={{ width: "200%" }}
                >
                  <div className="extraWidgetInfo">
                    <div className="extraTitle">Pass Rate {passRate ? `${passRate}%`: []}</div>
                    <div className="progress">
                      <div
                        className="progressPercentage"
                        style={{ width: `${passRate}%` }}
                      ></div>
                    </div>
                  </div>
                </Widget>
                <Widget info={voters.length} title="Eligible Voters" />
                <Widget info={totalP-counted} title="Ongoing Proposals" />
              </div>
              Recent Proposals
              <div style={{ marginTop: "30px" }}>
                <Table
                  columnsConfig="10% 70% 20%"
                  data={proposals}
                  header={[
                    <span className="table_id">ID</span>,
                    <span className="table_desc">Description</span>,
                    <span className="table_status">Status</span>,
                  ]}
                  pageSize={5}
                />
              </div>

              <Form
                  buttonConfig={{
                    isLoading: sub,
                    loadingText: "Submitting Proposal",
                    text: "Submit",
                    theme: "secondary",
                  }}
                  data={[
                    {
                      inputWidth: "100%",
                      name: "New Proposal",
                      type: "textarea",
                      validation: {
                        required: true,
                      },
                      value: "",
                    },
                  ]}
                  onSubmit={(e) => {
                    setSub(true);
                    createProposal(e.data[0].inputResult);
                  }}
                  title="Create a New Proposal"
                />


            </div>
            )}
       
      </div>
      <div className="voting"></div>
    </>
  );
};

export default Home;
