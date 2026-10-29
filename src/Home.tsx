import { useState } from "react";
import { Chess } from "chess.js";
import { useNavigate } from "react-router";
import botImage from "./assets/bot_image.png";


type HomeProps = {
    setGame: (game: Chess) => void;
}

function Home( {setGame} : HomeProps){
    const [pgn, setPgn] = useState(`1. e4 c6 2. Nf3 d5 3. exd5 cxd5 4. Nc3 Nf6 5. d4 Bg4 6. h3 Bxf3 7. Qxf3 e6 8.
	Bg5 Be7 9. O-O-O O-O 10. Bxf6 Bxf6 11. g4 Nc6 12. Bd3 Nxd4 13. Qe3 h6 
	14. Nb5
	Bg5 15. f4 Bf6 16. Nxd4 Rc8 17. g5 Be7 18. gxh6 g6 19. Rhg1 Kh7 20. f5 Rc6 21.
	fxg6+ fxg6 22. Bxg6+ Kh8 23. Qe5+ Bf6 24. Nxe6 Rxc2+ 25. Kxc2 Qc8+ 26. Kd3 Bxe5
	27. Bf5 Rxf5 28. Rg7 Qxe6 29. Rdg1 Rf3+ 30. Ke2 Bxg7+ 31. Kxf3 Bxh6 32. b4 Qe5
	33. Rg4 Qe3+ 34. Kg2 Bf4 35. Rh4+ Kg7 36. Rg4+ Kf6 37. Rxf4+ Ke5 38. Re4+ Kxe4
	39. Kf1 Qd2 40. Kg1 Ke3 41. a3 Qf2+ 42. Kh1 Kf3 43. h4 Kg3 44. h5 Qg2# 0-1`);
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
