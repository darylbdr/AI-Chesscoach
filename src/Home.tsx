import { useState } from "react";
import { Chess } from "chess.js";
import { useNavigate } from "react-router";
import botImage from "./assets/bot_image.png";


type HomeProps = {
    setGame: (game: Chess) => void;
}

function Home( {setGame} : HomeProps){
    const [pgn, setPgn] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate()

    const handleAnalyze = () => {
        if (!pgn.trim()) {
            setErrorMessage("Please paste a PGN before analyzing.");
            return;
        }
        const chessGame = new Chess();
        const moveList = [];
        try
        {
            chessGame.loadPgn(pgn);
            setGame(chessGame);
            moveList.push(chessGame.history());
            setErrorMessage("")
        }
        catch(e){
            console.log("Invalid PGN: ", e);
            setErrorMessage("This PGN is invalid. Please check it.")
            return;    
        }
        
        navigate("/board");
    }

    return (
        <div style={{
            width: '100%',
            margin: 'auto',
            maxWidth: '900px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '24px',
            }}>
                <img
                    src={botImage}
                    alt="AI Chess Coach logo"
                    style={{ width: '64px', height: '80px', objectFit: 'contain' }}
                />
                <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 'bold' }}>
                    AI Chess Coach
                </h1>
            </div>

            <div style={{
                width: '100%',
                backgroundColor: '#313442f7',
                borderRadius: '15px',
                paddingTop: '10px',
            }}>
                <h1 style={{
                    paddingLeft: '40px',
                    fontSize: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>Import a game</h1>
                
                <p style={{
                    textAlign: 'left',
                    display:'block',
                    marginInlineStart: '45px',
                    marginInlineEnd: '0px'
                }}>You need to paste the PGN of the game you want to analyze.</p>
                
                <p style={{
                    paddingTop: '12px',
                    textAlign: 'left',
                    marginInlineStart: '45px',
                    fontWeight: 'bold',
                    fontSize: '15px'
                }}>Paste the PGN below</p>
                
                <textarea value={pgn} onChange={(e) => setPgn(e.target.value)} style={{
                    width: '90%',
                    height: '20vh',
                    marginTop: '15px',
                    marginBottom: '30px',
                    borderRadius: '7px',
                    
                }}></textarea>

                {errorMessage && (
                    <p style={{ color: "red" }}>{errorMessage}</p>
                )}
                
                <button className="analyze-button" onClick={handleAnalyze}>Analyze the game</button>
            </div>
        </div>

    );

}
export default Home;
