
import React from 'react';

const testimonials = [
  {
    name: "Ana Silva",
    business: "Brechó Estilo Único",
    quote: "O Garagem Secreta transformou completamente a forma como gerencio as finanças do meu brechó. Economizo horas toda semana e tenho uma visão clara da saúde financeira do negócio.",
    image: "/placeholder.svg"
  },
  {
    name: "Carlos Mendes",
    business: "Designer Freelancer",
    quote: "Como freelancer, eu precisava de uma solução que me ajudasse a organizar minhas finanças sem complicação. O Garagem Secreta é exatamente isso - simples, eficiente e completo.",
    image: "/placeholder.svg"
  },
  {
    name: "Patrícia Almeida",
    business: "Ateliê de Costura",
    quote: "As projeções e alertas são incríveis! Consigo planejar o futuro do meu ateliê com muito mais confiança e nunca mais perdi prazos de pagamentos importantes.",
    image: "/placeholder.svg"
  }
];

const TestimonialsSection = () => {
  return (
    <div className="py-20 bg-rose-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-amber-800 mb-4">
            O Que Nossos Clientes Dizem
          </h2>
          <p className="text-lg text-stone-600 max-w-3xl mx-auto">
            Histórias de sucesso de empreendedores que transformaram suas finanças com o Garagem Secreta
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 opacity-0 hover:shadow-md transition-shadow"
              style={{ animation: `fade-in 0.6s ease-out ${index * 0.2}s forwards` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover bg-gs-light"
                />
                <div>
                <h4 className="font-semibold text-amber-800">{testimonial.name}</h4>
                <p className="text-sm text-stone-600">{testimonial.business}</p>
                </div>
              </div>
              <blockquote className="text-stone-700 italic">
                "{testimonial.quote}"
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
