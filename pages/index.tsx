import useSwr from "swr";
import { useWeb3React } from "@web3-react/core";
import Head from "next/head";
import TokenBalance from "../components/TokenBalance";
import useEagerConnect from "../hooks/useEagerConnect";
import { parseBalanceToNum } from "../util";
import { useRouter } from "next/router";
import { UserRejectedRequestError } from "@web3-react/injected-connector";
import { useEffect, useState } from "react";
import { injected } from "../connectors";
import useMetaMaskOnboarding from "../hooks/useMetaMaskOnboarding";
import * as React from "react";
import classNames from "classnames";

const FWEB3_TOKEN_ADDRESS = "0x4a14ac36667b574b08443a15093e417db909d7a3";

const fetcher = (url) => fetch(url).then((res) => res.json());

type AccountProps = {
  triedToEagerConnect: boolean;
};

const Account = ({ triedToEagerConnect }: AccountProps) => {
  const { query } = useRouter();

  const { active, error, activate, account, setError } = useWeb3React();

  const { isWeb3Available, startOnboarding, stopOnboarding } =
    useMetaMaskOnboarding();

  // manage connecting state for injected connector
  const [connecting, setConnecting] = useState(false);
  useEffect(() => {
    if (active || error) {
      setConnecting(false);
      stopOnboarding();
    }
  }, [active, error, stopOnboarding]);

  if (error) {
    return null;
  }

  if (!triedToEagerConnect) {
    return null;
  }

  if (typeof account !== "string") {
    return (
      <button
        className="pulse"
        onClick={
          isWeb3Available
            ? () => {
                setConnecting(true);

                activate(injected, undefined, true).catch((error) => {
                  // ignore the error if it is a user rejected request
                  if (error instanceof UserRejectedRequestError) {
                    setConnecting(false);
                  } else {
                    setError(error);
                  }
                });
              }
            : startOnboarding
        }
      >
        Connect your wallet
      </button>
    );
  }
};

type DotProps = {
  index: number;
  setActiveDot: (index: number) => void;
  activeDot: number;
  gameTileCompletionStates: number[];
  children: React.ReactNode;
};

const Dot: React.FC<DotProps> = ({
  index,
  setActiveDot,
  activeDot,
  gameTileCompletionStates,
  children,
}) => {
  return (
    <div
      data-test-id={`js-dot${index}`}
      onClick={() => setActiveDot(index)}
      className={classNames("game-tile", {
        active: activeDot === index,
        completed: gameTileCompletionStates[index],
      })}
    >
      <div className="tooltip">{children}</div>
    </div>
  );
};

export default function Home() {
  const { query } = useRouter();

  const { account, library, active, chainId } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

  const isConnected = typeof account === "string" && !!library;

  const { data: polygonData, error } = useSwr(
    `/api/polygon?wallet_address=${query.wallet ? query.wallet : account}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [activeDot, setActiveDot] = useState(-1);

  let gameTileCompletionStates = [
    isConnected || query.wallet ? 1 : 0,
    parseBalanceToNum((polygonData && polygonData["tokenBalance"]) ?? 0) >= 100
      ? 1
      : 0,
    polygonData && polygonData["hasUsedFaucet"] ? 1 : 0,
    polygonData && polygonData["hasSentTokens"] ? 1 : 0,
    polygonData && polygonData["hasMintedNFT"] ? 1 : 0,
    polygonData && polygonData["hasBurnedTokens"] ? 1 : 0,
    polygonData && polygonData["hasSwappedTokens"] ? 1 : 0,
    polygonData && polygonData["hasVotedInPoll"] ? 1 : 0,
    polygonData && polygonData["hasDeployedContract"] ? 1 : 0,
  ];

  let completedTiles = 0;
  for (let i = 0; i < gameTileCompletionStates.length; i++) {
    completedTiles += gameTileCompletionStates[i];
  }

  const toolTipTexts = [
    "Connect your wallet",
    "Get 100 $FWEB3 tokens",
    "Use the faucet to get .1 $MATIC",
    "Send 100 $FWEB3 tokens to someone",
    "Mint a Fweb3 NFT",
    "Burn at least one $FWEB3 token",
    "Swap a $FWEB3 token for some $MATIC",
    "Vote on a Fweb3 poll",
    "Write and deploy a smart contract",
  ];

  return (
    <div>
      <Head>
        <title>Fweb3</title>
        <meta name="description" content="Learn and build web3" />
        <link rel="icon" href="/icon.png" />
        <meta content="Learn and build web3" name="description" />
        <meta content="Fweb3" property="og:title" />
        <meta content="Learn and build web3" property="og:description" />
        <meta content="https://fweb3.xyz/fweb3.png" property="og:image" />
        <meta content="Fweb3 – Learn and build web3" property="twitter:title" />
        <meta content="https://fweb3.xyz/fweb3.png" property="twitter:image" />
        <meta property="og:type" content="website" />
        <meta content="summary_large_image" name="twitter:card" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <nav>
        <h1>fweb3</h1>

        <p>
          <strong>{Math.round((completedTiles / 9) * 100)}%</strong> complete
        </p>

        {query.wallet !== undefined &&
          query.wallet !== account &&
          query.wallet.length > 0 && (
            <p style={{ color: "#fff" }}>{query.wallet}</p>
          )}

        {isConnected || query.wallet ? (
          <TokenBalance
            balance={polygonData && polygonData["tokenBalance"]}
            symbol="FWEB3"
          />
        ) : (
          <div>0 FWEB3</div>
        )}
      </nav>

      <main>
        <section>
          <div className="game-grid">
            {toolTipTexts.map((toolTipText, index) => (
              <Dot
                key={`${index}-${toolTipText}`}
                index={index}
                gameTileCompletionStates={gameTileCompletionStates}
                activeDot={activeDot}
                setActiveDot={setActiveDot}
              >
                {toolTipText}
              </Dot>
            ))}
          </div>

          <a
            className="share-button"
            onClick={() => {
              let gameTiles = document.getElementsByClassName("game-tile");
              let completedGameTiles = [];
              for (let i = 0; i < gameTiles.length; i++) {
                completedGameTiles.push(
                  gameTiles[i].classList.contains("completed")
                );
              }

              let shareText = `Fweb3 ${completedGameTiles.reduce(
                (a, b) => a + b
              )}/9\n\n`;

              for (let i = 0; i < gameTiles.length; i++) {
                shareText += completedGameTiles[i] ? "🟣" : "⚫️";

                if (i % 3 == 2 && i != gameTiles.length - 1) {
                  shareText += "\n";
                }
              }

              if (navigator.share) {
                navigator.share({
                  text: shareText,
                });
              } else {
                window.open(
                  "https://twitter.com/intent/tweet?text=" +
                    encodeURIComponent(shareText)
                );
              }
            }}
          >
            Share your progress
          </a>
        </section>
        <section>
          {activeDot === -1 && (
            <>
              <h2>Learn and build in web3.</h2>
              <p>
                There are 9 dots to light up by doing things on a blockchain (in
                this case, Polygon). Once you light them all up, you win
                additional $FWEB3 tokens and a commemorative NFT.
              </p>
            </>
          )}
          {activeDot === 0 && (
            <>
              <h2>Connect your wallet</h2>
              <p>These are instructions for how to do dot 0.</p>
            </>
          )}
          {activeDot === 1 && (
            <>
              <h2>Receive tokens (for free!)</h2>
              <p>These are instructions for how to do dot 1.</p>
            </>
          )}
          {activeDot === 2 && (
            <>
              <h2>Receive gas using tokens (for free!)</h2>
              <p>These are instructions for how to do dot 2.</p>
            </>
          )}
          {activeDot === 3 && (
            <>
              <h2>Use gas to send tokens</h2>
              <p>These are instructions for how to do dot 3.</p>
            </>
          )}
          {activeDot === 4 && (
            <>
              <h2>Mint an NFT</h2>
              <p>These are instructions for how to do dot 4.</p>
            </>
          )}
          {activeDot === 5 && (
            <>
              <h2>Burn a token</h2>
              <p>These are instructions for how to do dot 5.</p>
            </>
          )}
          {activeDot === 6 && (
            <>
              <h2>Swap a token</h2>
              <p>These are instructions for how to do dot 6.</p>
            </>
          )}
          {activeDot === 7 && (
            <>
              <h2>Vote in a proposal with your tokens</h2>
              <p>These are instructions for how to do dot 7.</p>
            </>
          )}
          {activeDot === 8 && (
            <>
              <h2>Create your own token</h2>
              <p>These are instructions for how to do dot 8.</p>
            </>
          )}
          {!gameTileCompletionStates[0] && !query.wallet && (
            <div>
              <p>
                It&apos;s free to play. Login with MetaMask to get started
                (you&apos;ll be prompted to install it if you don&apos;t have it
                already):
              </p>
              <p>
                <Account triedToEagerConnect={triedToEagerConnect} />
              </p>
              {chainId !== undefined && chainId !== 137 && !query.wallet && (
                <p style={{ color: "#f55", marginTop: "1rem" }}>
                  Switch to Polygon via MetaMask to play this game.
                </p>
              )}
            </div>
          )}
          {completedTiles === 9 && !query.wallet && (
            <div>
              <p>
                <strong style={{ color: "white" }}>
                  You&apos;ve completed all the dots! Paste your wallet address
                  into #finish-line in Discord.
                </strong>
              </p>
            </div>
          )}
        </section>
      </main>
      <footer>
        <a href="https://s-h-l.notion.site/Walkthrough-058a7ba0a8fe4d798370e4f6a5fda8b0">
          Walkthrough
        </a>
        <a href="https://discord.gg/dNvYpeg2RC">Discord</a>
        <a href="https://github.com/slavingia/fweb3.xyz/issues">GitHub</a>
      </footer>
    </div>
  );
}
