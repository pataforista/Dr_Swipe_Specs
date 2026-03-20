import { motion } from 'framer-motion';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shineColor?: string;
}

const ShinyText: React.FC<ShinyTextProps> = ({ 
  text, 
  disabled = false, 
  speed = 4, 
  className = "",
  shineColor = "#ffffff"
}) => {
  const animationProps = disabled ? {} : {
    animate: {
      backgroundPosition: ["200% 0", "-200% 0"],
    },
    transition: {
      repeat: Infinity,
      duration: speed,
      ease: "linear" as const,
    }
  };

  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-white/20 via-white to-white/20 bg-[length:200%_auto] ${className}`}
      style={{ backgroundImage: `linear-gradient(90deg, transparent 0%, ${shineColor} 50%, transparent 100%)` }}
      {...animationProps}
    >
      {text}
    </motion.span>
  );
};

export default ShinyText;
