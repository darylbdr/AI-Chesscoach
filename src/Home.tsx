import { useNavigate } from "react-router";

function Home(){

    const navigate = useNavigate();
    const handleAnalyze = () =>{
        navigate('/board');
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
            }}>You just need to load a PGN of the game you want to analyze</p>
            
            <p style={{
                paddingTop: '12px',
                textAlign: 'left',
                marginInlineStart: '45px',
                fontWeight: 'bold',
                fontSize: '15px'
            }}>Paste the PGN below</p>
            
            <textarea style={{
                width: '90%',
                height: '20vh',
                marginTop: '5px',
                marginBottom: '55px',
                borderRadius: '7px',
                
            }}></textarea>
            
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