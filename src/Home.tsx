import { useState } from "react";
import { Chess } from "chess.js";
import { useNavigate } from "react-router";


type HomeProps = {
    setGame: (game: Chess) => void;
}

function Home( {setGame} : HomeProps){
    const [pgn, setPgn] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate()

    const handleAnalyze = () => {
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
            backgroundColor: '#313442f7'
        }}>
            <h1 style={{
                paddingLeft: '40px',
                fontSize: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>Load a game</h1>
            
            <p style={{
                textAlign: 'left',
                display:'block',
                marginInlineStart: '45px',
                marginInlineEnd: '0px'
            }}>You just need to load the PGN of the game you want to analyze</p>
            
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
                marginTop: '5px',
                marginBottom: '55px',
                borderRadius: '7px',
                
            }}></textarea>

            {errorMessage && (
                <p style={{ color: "red" }}>{errorMessage}</p>
            )}
            
            <button onClick={handleAnalyze} style={{
                margin: '0 0px 40px 0',
                textTransform: 'uppercase',
                background: 'hsl(209 79% 56%)',
                padding:'.8em 1em',
                borderRadius: '7px',
                fontFamily: 'Roboto, sans-serif',
                border: 'None'
            }}>Analyze the game</button>
        </div>

    );

}
export default Home;