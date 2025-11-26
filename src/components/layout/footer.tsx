
import { Stethoscope, Instagram, Send, MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const socialLinks = [
    { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/urovitale/' },
    { name: 'TikTok', icon: Send, href: '#' },
];

const usefulLinks = [
    { name: 'Sobre Nosotros', href: '/en-construccion' },
    { name: 'Servicios', href: '#services' },
    { name: 'Departamentos', href: '/en-construccion' },
    { name: 'Doctores', href: '#doctors' },
]

export default function Footer() {
    return (
        <footer id="contact" className="bg-white dark:bg-[#0D122A] border-t border-border">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Logo & Description */}
                    <div className="space-y-6">
                        <Link href="/landing" className="flex items-center gap-2 font-bold text-lg">
                            <Image
                                src="/images/logo/urovital-logo.png"
                                alt="UroVital"
                                width={153}
                                height={55}
                                className="h-[55px] w-[153px] object-contain"
                                priority
                            />
                        </Link>
                        <p className="text-muted-foreground leading-relaxed">
                            Ofrecemos atención médica especializada con tecnología avanzada y un equipo humano
                            comprometido con tu bienestar integral.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map(link => {
                                const Icon = link.icon;
                                return (
                                    <Button
                                        key={link.name}
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        className="hover:bg-urovital-blue/10 hover:text-urovital-blue transition-colors"
                                    >
                                        <Link href={link.href} aria-label={link.name}>
                                            <Icon className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Useful Links */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-lg text-foreground">Enlaces Útiles</h4>
                        <ul className="space-y-3">
                            {usefulLinks.map(link => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-urovital-blue transition-colors duration-200"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-lg text-foreground">Contacto</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-urovital-blue mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-muted-foreground">Valencia, Edo. Carabobo</p>
                                    <p className="text-sm text-muted-foreground">Venezuela</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-urovital-blue flex-shrink-0" />
                                <a
                                    href="tel:+584121772206"
                                    className="text-muted-foreground hover:text-urovital-blue transition-colors"
                                >
                                    +58 412-177 2206
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-urovital-blue flex-shrink-0" />
                                <a
                                    href="mailto:info@urovital.com"
                                    className="text-muted-foreground hover:text-urovital-blue transition-colors"
                                >
                                    info@urovital.com
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-lg text-foreground">Boletín</h4>
                        <p className="text-muted-foreground">
                            Suscríbete para recibir noticias, consejos de salud y ofertas exclusivas.
                        </p>
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input
                                type="email"
                                placeholder="Tu email"
                                className="bg-background border-border focus:border-urovital-blue focus:ring-urovital-blue"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="bg-urovital-blue hover:bg-urovital-blue/90 text-white"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-muted-foreground text-sm">
                            &copy; {new Date().getFullYear()} UroVital. Todos los derechos reservados.
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <Link href="/privacy" className="text-muted-foreground hover:text-urovital-blue transition-colors">
                                Política de Privacidad
                            </Link>
                            <Link href="/terms" className="text-muted-foreground hover:text-urovital-blue transition-colors">
                                Términos de Servicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
