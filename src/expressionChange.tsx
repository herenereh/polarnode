import expression1 from './assets/brrr.png';
import expression2 from './assets/hothothot.png';
import expression3 from './assets/content.png';

export function ExpressionChange({ temp }: { temp: number | null }) {
  if (temp === null) return null;

  const expression = temp < 3 ? expression1 : temp > 7 ? expression2 : expression3;

  return (
    <img src={expression} 
    alt="Expression" 
    style={{ 
        width: '250px', 
        height: '150px', 
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translateX(-50%)',
    }} 
    />
    );
}

export default ExpressionChange;