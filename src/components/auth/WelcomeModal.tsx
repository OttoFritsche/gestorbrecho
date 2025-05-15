import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold text-pink-600">
            ✨ Bem-vinda ao Gestor Brechó! ✨
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Olá! Estamos muito felizes em ter você aqui para ajudar a organizar e
            fazer seu brechó crescer ainda mais!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 px-2 space-y-6 text-sm">
          <p>
            Para que tudo funcione perfeitamente desde o início, preparamos
            algumas dicas rápidas:
          </p>

          <div className="p-4 border rounded-lg bg-pink-50 border-pink-200">
            <h3 className="font-semibold text-md text-pink-700 mb-2">
              1️⃣ Começando com o Pé Direito: Seus Primeiros Cadastros
            </h3>
            <p className="mb-2 text-muted-foreground">
              Pense nisso como arrumar a casa antes da festa! Siga esta ordem
              simples ao cadastrar suas informações:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong>Crie suas Categorias de Produtos:</strong>
                <br />
                <span className="text-xs">
                  (Ex: Roupas Femininas, Sapatos, Bolsas, Decoração). Isso
                  deixa seu estoque super organizado! (Menu:{" "}
                  <code>Catálogo &gt; Categorias</code>)
                </span>
              </li>
              <li>
                <strong>Cadastre seus Produtos:</strong>
                <br />
                <span className="text-xs">
                  Agora sim, coloque cada peça no sistema, dentro da categoria
                  certa. (Menu:{" "}
                  <code>Catálogo &gt; Produtos &gt; Novo Produto</code>)
                </span>
              </li>
              <li>
                <strong>Clientes (Seus Fãs!):</strong>
                <br />
                <span className="text-xs">
                  Registre quem compra de você para conhecer melhor seus
                  clientes. (Menu: <code>Cadastros &gt; Clientes</code>)
                </span>
              </li>
              <li>
                <strong>Formas de Pagamento:</strong>
                <br />
                <span className="text-xs">
                  Configure como você vai receber (Ex: Dinheiro, Cartão, Pix).
                  (Menu: <code>Financeiro &gt; Formas de Pagamento</code>)
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 border rounded-lg bg-sky-50 border-sky-200">
            <h3 className="font-semibold text-md text-sky-700 mb-2">
              2️⃣ Organizando o Dinheiro: Categorias Financeiras Primeiro!
            </h3>
            <p className="mb-2 text-muted-foreground">
              Para saber direitinho para onde seu dinheiro vai e de onde ele
              vem, o segredo é:{" "}
              <strong>
                sempre crie as categorias ANTES de lançar suas receitas e
                despesas!
              </strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>
                <strong>Categorias de Receitas:</strong>
                <br />
                <span className="text-xs">
                  (Ex: "Vendas de Roupas", "Serviços Extras"). (Menu:{" "}
                  <code>Categorias &gt; Nova Categoria</code>, tipo "Receita")
                </span>
              </li>
              <li>
                <strong>Categorias de Despesas:</strong>
                <br />
                <span className="text-xs">
                  (Ex: "Aluguel da Loja", "Compras de Mercadoria"). (Menu:{" "}
                  <code>Categorias &gt; Nova Categoria</code>, tipo "Despesa")
                </span>
              </li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground italic">
              Depois de criar essas "gavetinhas" financeiras, fica fácil
              registrar cada entrada e saída de dinheiro nos menus "Receitas" e
              "Despesas", escolhendo a categoria certa!
            </p>
          </div>

          <p className="text-center text-muted-foreground">
            Prontinho para começar? Se tiver dúvidas, temos guias e suporte
            para te ajudar!
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="bg-pink-600 hover:bg-pink-700">
            Entendi, vamos começar!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 