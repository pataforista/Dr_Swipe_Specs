import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { SwipeCard } from '../../types/clinical';
import './SwipeDeck.css';

interface SwipeDeckProps {
    cards: SwipeCard[];
    currentIndex: number;
    onSwipe: (direction: 'left' | 'right') => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ cards, currentIndex, onSwipe }) => {
    const [exitX, setExitX] = useState<number | string>(0);

    const activeCards = cards.slice(currentIndex, currentIndex + 3);

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x > 100) {
            setExitX(500);
            onSwipe('right');
        } else if (info.offset.x < -100) {
            setExitX(-500);
            onSwipe('left');
        }
    };

    return (
        <div className="swipe-deck">
            <AnimatePresence mode='popLayout'>
                {activeCards.reverse().map((card, idx) => {
                    const isTop = idx === activeCards.length - 1;
                    return (
                        <motion.div
                            key={card.id}
                            className={`swipe-card ${isTop ? 'top-card' : 'back-card'}`}
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{
                                scale: 1 - (activeCards.length - 1 - idx) * 0.05,
                                y: (activeCards.length - 1 - idx) * 10,
                                opacity: 1,
                                rotate: 0
                            }}
                            exit={{ x: exitX, opacity: 0, rotate: exitX > 0 ? 20 : -20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            drag={isTop ? 'x' : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="card-content">
                                <span className="card-category">{card.category}</span>
                                <p className="card-text">{card.card_text}</p>
                                {card.critical && (
                                    <div className="card-critical-badge">⚠ CRÍTICO</div>
                                )}
                            </div>
                            {isTop && (
                                <>
                                    <div style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        width: 36,
                                        height: 36,
                                        background: 'linear-gradient(135deg, #98D8C8, #87CEEB)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 900,
                                        fontSize: '1.2rem',
                                        opacity: 0.6,
                                        pointerEvents: 'none'
                                    }}>✓</div>
                                    <div style={{
                                        position: 'absolute',
                                        top: 12,
                                        left: 12,
                                        width: 36,
                                        height: 36,
                                        background: 'linear-gradient(135deg, #FF9F7F, #FF6B6B)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 900,
                                        fontSize: '1.2rem',
                                        opacity: 0.6,
                                        pointerEvents: 'none'
                                    }}>✕</div>
                                </>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
