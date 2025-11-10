import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Zap, 
  Wrench, 
  Hammer, 
  Thermometer, 
  Building, 
  Leaf, 
  Paintbrush, 
  SprayCan 
} from "lucide-react";

const iconMap = {
  zap: Zap,
  wrench: Wrench,
  hammer: Hammer,
  thermometer: Thermometer,
  building: Building,
  leaf: Leaf,
  paintbrush: Paintbrush,
  spray: SprayCan,
};

const colorMap = {
  blue: "from-blue-50 to-indigo-100 bg-blue-600",
  green: "from-green-50 to-emerald-100 bg-green-500",
  amber: "from-amber-50 to-yellow-100 bg-amber-500",
  purple: "from-purple-50 to-violet-100 bg-purple-600",
  red: "from-red-50 to-pink-100 bg-red-500",
  teal: "from-teal-50 to-cyan-100 bg-teal-500",
  orange: "from-orange-50 to-red-100 bg-orange-500",
  gray: "from-gray-50 to-slate-100 bg-gray-600",
};

interface ServiceCardProps {
  category: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  };
}

export default function ServiceCard({ category }: ServiceCardProps) {
  const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Wrench;
  const colorClasses = colorMap[category.color as keyof typeof colorMap] || colorMap.blue;
  const [gradientClasses, bgClass] = colorClasses.split(' bg-');

  return (
    <Link to={`/services?category=${category.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl" data-testid={`service-card-${category.name.toLowerCase()}`}>
        <CardContent className="p-8">
          <div className={`bg-gradient-to-br ${gradientClasses} rounded-2xl text-center`}>
            <div className={`w-16 h-16 mx-auto mb-4 bg-${bgClass} rounded-xl flex items-center justify-center text-white`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`category-name-${category.name.toLowerCase()}`}>
              {category.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4" data-testid={`category-description-${category.name.toLowerCase()}`}>
              {category.description}
            </p>
            <div className="text-blue-600 text-sm font-medium" data-testid={`category-providers-${category.name.toLowerCase()}`}>
              View Providers
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
