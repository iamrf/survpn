import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  icon: LucideIcon;
}

const PlaceholderPage = ({ title, icon: Icon }: PlaceholderPageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-12"
    >
      {/* Animated Icon */}
      <motion.div
        className="mb-6"
        animate={{ 
          y: [0, -8, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
          
          {/* Icon container */}
          <div className="relative glass rounded-2xl p-6">
            <Icon className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>
        </div>
      </motion.div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-3">
        {title}
      </h1>

      {/* Coming Soon */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-full px-6 py-2"
      >
        <span className="text-muted-foreground">
          به زودی...
        </span>
      </motion.div>

      {/* Decorative animation */}
      <motion.div
        className="mt-8 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary/40"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default PlaceholderPage;
