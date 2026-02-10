import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const WelcomeSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-12"
    >
      {/* Floating Icon */}
      <motion.div
        className="mb-8"
        animate={{ y: [0, -12, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150" />
          
          {/* Icon container */}
          <motion.div
            className="relative glass rounded-3xl p-8 animate-pulse-glow"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </motion.div>
        </div>
      </motion.div>

      {/* Welcome Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-foreground mb-3">
          خوش آمدید
        </h1>
        <p className="text-lg text-muted-foreground max-w-xs mx-auto leading-relaxed">
          به اپلیکیشن مینی تلگرام خوش آمدید
        </p>
      </motion.div>

      {/* Decorative dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex gap-2 mt-8"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary/50"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default WelcomeSection;
